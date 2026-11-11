/* eslint-disable no-await-in-loop -- A shared database session requires ordered migrations, writes and role checks. */
import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { Schema } from "effect";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { HttpUrl } from "../../src/lib/listings/url";

// Real embedded Postgres, one shared session. This does not exercise PostgREST,
// hosted Supabase configuration, network transport or concurrent transactions.
const db = new PGlite({ extensions: { pg_trgm } });
const sourceId = "00000000-0000-4000-8000-000000000001";
const listingId = "00000000-0000-4000-8000-000000000002";
const captured = "2026-11-11T12:00:00Z";
const starts = "2026-11-20T12:00:00Z";
const listing = (overrides: Record<string, unknown> = {}) => ({
  source_id: sourceId,
  dedupe_key: "class-1",
  title: "Morning practice",
  category_slug: "class",
  discipline_slug: "tai-chi",
  source_url: "https://example.org/class",
  status: "active",
  cost_status: "free",
  ...overrides,
});
const evidence = (overrides: Record<string, unknown> = {}) => ({
  quote: "This class is free",
  url: "https://example.org/class",
  captured_at: captured,
  method: "curated",
  supports_cost_status: "free",
  ...overrides,
});
const occurrence = (overrides: Record<string, unknown> = {}) => ({
  starts_at: starts,
  source_occurrence_key: "session-1",
  ...overrides,
});
async function ingest(
  payload: unknown = listing(),
  occurrences: unknown = [occurrence()],
  quotes: unknown = [evidence()],
) {
  const result = await db.query<{ id: string }>(
    "select public.ingest_listing($1::jsonb, $2::jsonb, $3::jsonb) as id",
    [JSON.stringify(payload), JSON.stringify(occurrences), JSON.stringify(quotes)],
  );
  return result.rows[0].id;
}
async function transaction(work: () => Promise<unknown>) {
  await db.exec("begin");
  try {
    await work();
    await db.exec("commit");
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}
async function asRole(
  role: "anon" | "authenticated" | "service_role",
  work: () => Promise<unknown>,
) {
  await db.exec(`set role ${role}`);
  try {
    await work();
  } finally {
    await db.exec("reset role");
  }
}
async function counts() {
  const { rows } = await db.query<{ listings: number; occurrences: number; evidence: number }>(`
    select (select count(*)::int from public.listings) as listings,
      (select count(*)::int from public.listing_occurrences) as occurrences,
      (select count(*)::int from public.listing_evidence) as evidence
  `);
  return rows[0];
}
async function timestamps() {
  const { rows } = await db.query<{
    first_seen_at: Date;
    last_seen_at: Date;
    last_verified_at: Date;
  }>("select first_seen_at, last_seen_at, last_verified_at from public.listings");
  return rows[0];
}
async function insertListing(cost: string, verified: string | null = captured) {
  await db.query(
    `insert into public.listings
    (id, title, category_slug, source_id, source_url, dedupe_key, cost_status, last_verified_at)
    values ($1, 'Practice', 'class', $2, 'https://example.org/', 'direct', $3, $4)`,
    [listingId, sourceId, cost, verified],
  );
}
async function insertEvidence(cost: string) {
  await db.query(
    `insert into public.listing_evidence
    (listing_id, source_id, quote, url, captured_at, method, supports_cost_status)
    values ($1, $2, 'Free entry', 'https://example.org/', $3, 'curated', $4)`,
    [listingId, sourceId, captured, cost],
  );
}

beforeAll(async () => {
  // Supabase's broad defaults MUST precede table/function creation, so the
  // migration's explicit revokes (especially TRUNCATE/EXECUTE) are exercised.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  `);
  await db.exec(
    await readFile(new URL("../migrations/20261111000000_init.sql", import.meta.url), "utf8"),
  );
}, 20_000);
beforeEach(async () => {
  await db.exec("truncate public.sources, public.listings, public.ingestion_runs cascade");
  await db.query(
    `insert into public.sources (id, slug, name, url, method)
    values ($1, 'test-source', 'Test source', 'https://example.org/', 'curated')`,
    [sourceId],
  );
});
afterAll(async () => {
  await db.close();
});

describe("migration", () => {
  it("applies cleanly with pg_trgm and retains indexes and RPC security", async () => {
    const { rows } = await db.query<{ extname: string }>(
      "select extname from pg_extension where extname = 'pg_trgm'",
    );
    expect(rows).toEqual([{ extname: "pg_trgm" }]);
    const indexes = await db.query<{ indexname: string }>(
      "select indexname from pg_indexes where tablename = 'listings'",
    );
    expect(indexes.rows.map((r) => r.indexname)).toEqual(
      expect.arrayContaining(["listings_search_idx", "listings_title_trgm_idx"]),
    );
    const fn = await db.query<{ prosecdef: boolean; proconfig: string[] }>(
      "select prosecdef, proconfig from pg_proc where oid = 'public.ingest_listing(jsonb,jsonb,jsonb)'::regprocedure",
    );
    expect(fn.rows[0]).toEqual({ prosecdef: false, proconfig: ["search_path=pg_catalog, public"] });
  });
});

describe.each(["free", "free_with_registration"])("deferred evidence: %s", (cost) => {
  it.each(["listing first", "evidence first"])(
    "commits matching evidence and verification: %s",
    async (order) => {
      await transaction(async () => {
        if (order === "evidence first") await insertEvidence(cost);
        await insertListing(cost);
        if (order === "listing first") await insertEvidence(cost);
      });
      expect(await counts()).toEqual({ listings: 1, occurrences: 0, evidence: 1 });
    },
  );
  it("rejects missing evidence at commit and rolls back", async () => {
    await expect(transaction(() => insertListing(cost))).rejects.toThrow(/matching cost evidence/);
    expect((await counts()).listings).toBe(0);
  });
  it("rejects missing last_verified_at at commit", async () => {
    await expect(
      transaction(async () => {
        await insertListing(cost, null);
        await insertEvidence(cost);
      }),
    ).rejects.toThrow(/last_verified_at/);
  });
  it("rejects mismatched supports_cost_status at commit", async () => {
    await expect(
      transaction(async () => {
        await insertListing(cost);
        await insertEvidence(cost === "free" ? "free_with_registration" : "free");
      }),
    ).rejects.toThrow(/matching cost evidence/);
  });
  it.each(["delete", "change claim", "move parent"])(
    "protects the last matching evidence: %s",
    async (action) => {
      await transaction(async () => {
        await insertListing(cost);
        await insertEvidence(cost);
      });
      const other = await ingest(
        listing({ dedupe_key: "other", cost_status: "unverified" }),
        [],
        [],
      );
      await expect(
        transaction(async () => {
          if (action === "delete")
            await db.query("delete from public.listing_evidence where listing_id = $1", [
              listingId,
            ]);
          else if (action === "change claim")
            await db.query(
              "update public.listing_evidence set supports_cost_status = 'unverified' where listing_id = $1",
              [listingId],
            );
          else
            await db.query(
              "update public.listing_evidence set listing_id = $1 where listing_id = $2",
              [other, listingId],
            );
        }),
      ).rejects.toThrow(/matching cost evidence/);
      expect((await counts()).evidence).toBe(1);
    },
  );
  it("allows cascading deletion of a free listing", async () => {
    await transaction(async () => {
      await insertListing(cost);
      await insertEvidence(cost);
    });
    await db.exec("delete from public.listings");
    expect(await counts()).toEqual({ listings: 0, occurrences: 0, evidence: 0 });
  });
});

describe("ingest_listing RPC", () => {
  it("inserts and repeats idempotently, preserving first_seen and advancing only last_seen", async () => {
    const id = await ingest();
    // Deterministic old timestamps avoid sleeps and clock-resolution assumptions.
    await db.exec(
      "update public.listings set first_seen_at = '2026-01-01', last_seen_at = '2026-01-02'",
    );
    const before = await timestamps();
    expect(await ingest()).toBe(id);
    const after = await timestamps();
    expect(after.first_seen_at).toEqual(before.first_seen_at);
    expect(after.last_seen_at.getTime()).toBeGreaterThan(before.last_seen_at.getTime());
    expect(after.last_verified_at).toEqual(before.last_verified_at);
    expect(after.last_verified_at.toISOString()).toBe("2026-11-11T12:00:00.000Z");
    expect(await counts()).toEqual({ listings: 1, occurrences: 1, evidence: 1 });
  });
  it("advances verification only for new matching evidence and never backwards", async () => {
    await ingest();
    const next = evidence({ captured_at: "2026-11-12T12:00:00Z" });
    await ingest(listing(), [], [next]);
    const verified = (await timestamps()).last_verified_at;
    expect(verified.toISOString()).toBe("2026-11-12T12:00:00.000Z");
    await ingest(
      listing(),
      [],
      [evidence({ captured_at: "2026-11-13T12:00:00Z", supports_cost_status: "unverified" })],
    );
    await ingest(listing(), [], [evidence({ captured_at: "2026-11-10T12:00:00Z" })]);
    await ingest(listing(), [], [next]);
    expect((await timestamps()).last_verified_at).toEqual(verified);
  });
  it.each([false, true])(
    "keyed reschedule preserves row identity (unkeyed interlude: %s)",
    async (interlude) => {
      await ingest();
      const before = await db.query<{ id: string }>("select id from public.listing_occurrences");
      if (interlude) await ingest(listing(), [occurrence({ source_occurrence_key: null })]);
      await ingest(listing(), [occurrence({ starts_at: "2026-11-21T12:00:00Z" })]);
      const after = await db.query<{ id: string; source_occurrence_key: string; starts_at: Date }>(
        "select id, source_occurrence_key, starts_at from public.listing_occurrences",
      );
      expect(after.rows).toEqual([
        {
          id: before.rows[0].id,
          source_occurrence_key: "session-1",
          starts_at: new Date("2026-11-21T12:00:00Z"),
        },
      ]);
    },
  );
  it("rejects conflicting non-null keys and rolls back the listing update", async () => {
    await ingest();
    await expect(
      ingest(listing({ title: "Changed" }), [occurrence({ source_occurrence_key: "different" })]),
    ).rejects.toThrow(/Conflicting source occurrence keys/);
    expect(
      (await db.query<{ title: string }>("select title from public.listings")).rows[0].title,
    ).toBe("Morning practice");
    expect((await counts()).occurrences).toBe(1);
  });
  it("rejects keyed reschedule onto another occurrence atomically", async () => {
    await ingest(listing(), [
      occurrence(),
      occurrence({ starts_at: "2026-11-21T12:00:00Z", source_occurrence_key: "session-2" }),
    ]);
    await expect(
      ingest(listing(), [occurrence({ starts_at: "2026-11-21T12:00:00Z" })]),
    ).rejects.toThrow(/unique constraint/);
    expect((await counts()).occurrences).toBe(2);
  });
  it("preserves omitted occurrences and applies explicit cancellation", async () => {
    await ingest();
    await ingest(listing(), []);
    expect((await counts()).occurrences).toBe(1);
    await ingest(listing(), [occurrence({ cancelled: true })]);
    expect(
      (await db.query<{ cancelled: boolean }>("select cancelled from public.listing_occurrences"))
        .rows[0].cancelled,
    ).toBe(true);
  });
  it("rolls back listing and occurrence writes when free evidence is missing", async () => {
    await expect(ingest(listing(), [occurrence()], [])).rejects.toThrow(/matching cost evidence/);
    expect(await counts()).toEqual({ listings: 0, occurrences: 0, evidence: 0 });
  });
  it("rolls back all changes when an evidence identity is reused with different content", async () => {
    await ingest();
    await expect(
      ingest(
        listing({ title: "Changed" }),
        [occurrence({ starts_at: "2026-11-21T12:00:00Z" })],
        [evidence({ quote: "Different" })],
      ),
    ).rejects.toThrow(/identity reused with different content/);
    expect(
      (await db.query<{ title: string }>("select title from public.listings")).rows[0].title,
    ).toBe("Morning practice");
    expect(
      (await db.query<{ starts_at: Date }>("select starts_at from public.listing_occurrences"))
        .rows[0].starts_at,
    ).toEqual(new Date(starts));
    expect(await counts()).toEqual({ listings: 1, occurrences: 1, evidence: 1 });
  });
  it.each([
    [null, [], []],
    [[], [], []],
    [listing(), {}, []],
    [listing(), [], null],
    [listing(), [null], []],
    [listing(), [{ starts_at: "invalid" }], []],
    [listing(), [], [evidence({ url: "https://?" })]],
    [listing({ borough: "Mars" }), [], []],
  ])("rejects malformed payload %# atomically", async (payload, occurrences, quotes) => {
    await expect(ingest(payload, occurrences, quotes)).rejects.toThrow();
    expect(await counts()).toEqual({ listings: 0, occurrences: 0, evidence: 0 });
  });
  it("defaults omitted fields to hidden/unverified and nullable unknowns", async () => {
    await ingest(
      {
        source_id: sourceId,
        dedupe_key: "defaults",
        title: "Unknown",
        category_slug: "class",
        source_url: "https://example.org/",
      },
      [],
      [],
    );
    const { rows } = await db.query(
      "select status, cost_status, borough, last_verified_at from public.listings",
    );
    expect(rows[0]).toEqual({
      status: "hidden",
      cost_status: "unverified",
      borough: null,
      last_verified_at: null,
    });
  });
});

// SQL deliberately accepts a narrower public DNS subset; TS uses WHATWG URL.
// The last column records the intentional differences, documented in architecture.
const urlCorpus = [
  ["https://example.org/", true, true],
  ["http://www.nycgovparks.org/events?a=1#details", true, true],
  ["https://sub.example.org:8443/path", true, true],
  ["https://example.org/path@venue?email=a@b.org", true, true],
  ["https://example.org/a%20b", true, true],
  ["https://user:pass@example.org/", false, false],
  ["https://user@example.org/", false, false],
  ["https://user%40name:pass@example.org/", false, false],
  ["https://?", false, false],
  ["https://#", false, false],
  ["https://", false, false],
  ["https://?example.org", false, false],
  ["javascript:alert(1)", false, false],
  ["data:text/html,test", false, false],
  ["ftp://example.org/", false, false],
  ["//example.org/", false, false],
  ["not a url", false, false],
  ["", false, false],
  ["https://exa mple.org/", false, false],
  ["https://example.org:65536/", false, false],
  ["https://example.org:abc/", false, false],
  ["https://-bad.example.org/", false, true],
  ["https://localhost/", false, true],
  ["https://foo.localhost/", false, true],
  ["https://intranet/", false, true],
  ["https://127.0.0.1/", false, true],
  ["https://[::1]/", false, true],
  ["https://例え.テスト/", false, true],
  ["HTTPS://example.org/", false, true],
  [" https://example.org/ ", false, true],
  ["https://example.org/a b", false, true],
  ["https://example.org\\path", false, true],
] as const;

describe("shared SQL / HttpUrl corpus", () => {
  it.each(urlCorpus)("checks %s (SQL %s, TS %s)", async (url, sqlAccepts, tsAccepts) => {
    const decode = Schema.decodeUnknownSync(HttpUrl);
    if (tsAccepts) expect(decode(url)).toBe(url);
    else expect(() => decode(url)).toThrow();
    const result = await db.query<{ valid: boolean }>("select public.is_http_url($1) as valid", [
      url,
    ]);
    expect(result.rows[0].valid).toBe(sqlAccepts);
    // Exercise each real constraint as well as the helper (no free-evidence
    // trigger involved, so a failure cannot be mistaken for a cost check).
    const writes = [
      () => db.query("update public.sources set url = $1", [url]),
      () => ingest(listing({ source_url: url, cost_status: "unverified" }), [], []),
      () => ingest(listing({ registration_url: url, cost_status: "unverified" }), [], []),
      () =>
        ingest(
          listing({ cost_status: "unverified" }),
          [],
          [evidence({ url, supports_cost_status: "unverified" })],
        ),
    ];
    for (const write of writes) {
      if (sqlAccepts) await write();
      else await expect(write()).rejects.toThrow(/check constraint/);
    }
  });
});

describe("joined search vector", () => {
  it("matches neighborhood, venue, borough, discipline and category absent from title/description", async () => {
    await ingest(listing({ neighborhood: "Harlem", venue: "Riverside", borough: "Manhattan" }));
    for (const term of ["Harlem", "Riverside", "Manhattan", "Tai chi", "Class"]) {
      const { rows } = await db.query(
        "select id from public.listings where search_document @@ plainto_tsquery('english', $1)",
        [term],
      );
      expect(rows).toHaveLength(1);
    }
    await ingest(listing({ neighborhood: "Chelsea" }));
    expect(
      (
        await db.query(
          "select id from public.listings where search_document @@ plainto_tsquery('english', 'Harlem')",
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "select id from public.listings where search_document @@ plainto_tsquery('english', 'Chelsea')",
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("refreshes existing vectors after discipline and category renames", async () => {
    await ingest();
    // Roll back taxonomy fixture changes after checking trigger propagation.
    await db.exec("begin");
    try {
      await db.exec(
        "update public.disciplines set name = 'Meditation' where slug = 'tai-chi'; update public.categories set name = 'Workshop' where slug = 'class'",
      );
      for (const term of ["Meditation", "Workshop"]) {
        expect(
          (
            await db.query(
              "select id from public.listings where search_document @@ plainto_tsquery('english', $1)",
              [term],
            )
          ).rows,
        ).toHaveLength(1);
      }
    } finally {
      await db.exec("rollback");
    }
  });
});

describe("RLS and least-privilege grants", () => {
  beforeEach(async () => {
    await ingest();
    await ingest(listing({ dedupe_key: "hidden", status: "hidden" }));
    await ingest(listing({ dedupe_key: "stale", status: "stale" }));
    await db.query("insert into public.ingestion_runs (source_id) values ($1)", [sourceId]);
  });
  it.each(["anon", "authenticated"] as const)(
    "%s reads only active listings and their visible children",
    async (role) => {
      await asRole(role, async () => {
        expect((await db.query("select * from public.listings")).rows).toHaveLength(1);
        expect((await db.query("select * from public.listing_occurrences")).rows).toHaveLength(1);
        expect((await db.query("select * from public.listing_evidence")).rows).toHaveLength(1);
      });
      await ingest(listing(), [occurrence({ cancelled: true })]);
      await asRole(role, async () => {
        expect((await db.query("select * from public.listing_occurrences")).rows).toHaveLength(0);
      });
    },
  );
  it.each(["anon", "authenticated"] as const)(
    "%s cannot write, read runs or execute ingestion",
    async (role) => {
      await asRole(role, async () => {
        for (const sql of [
          "insert into public.categories values ('forbidden', 'Forbidden')",
          "update public.listings set title = 'Forbidden'",
          "delete from public.listing_evidence",
          "truncate public.listings cascade",
          "select * from public.ingestion_runs",
        ])
          await expect(db.exec(sql)).rejects.toThrow(/permission denied/);
        await expect(ingest()).rejects.toThrow(/permission denied for function ingest_listing/);
        await expect(db.query("select public.is_http_url('https://example.org')")).rejects.toThrow(
          /permission denied for function is_http_url/,
        );
        // Check the entire grant matrix, not only representative denied writes.
        for (const table of [
          "categories",
          "disciplines",
          "sources",
          "listings",
          "listing_occurrences",
          "listing_evidence",
          "ingestion_runs",
        ]) {
          for (const privilege of ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]) {
            const { rows } = await db.query<{ allowed: boolean }>(
              "select has_table_privilege(current_user, $1, $2) as allowed",
              [`public.${table}`, privilege],
            );
            expect(rows[0].allowed).toBe(false);
          }
        }
      });
    },
  );
  it("service_role can ingest and DML operational records, but cannot TRUNCATE any table", async () => {
    await asRole("service_role", async () => {
      expect((await db.query("select * from public.listings")).rows).toHaveLength(3);
      await ingest(listing({ dedupe_key: "service" }));
      await db.exec(
        "update public.ingestion_runs set status = 'succeeded', finished_at = now(); delete from public.ingestion_runs",
      );
      await db.query("insert into public.ingestion_runs (source_id) values ($1)", [sourceId]);
      for (const table of [
        "categories",
        "disciplines",
        "sources",
        "listings",
        "listing_occurrences",
        "listing_evidence",
        "ingestion_runs",
      ]) {
        for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
          expect(
            (
              await db.query<{ allowed: boolean }>(
                "select has_table_privilege(current_user, $1, $2) as allowed",
                [`public.${table}`, privilege],
              )
            ).rows[0].allowed,
          ).toBe(true);
        }
        await expect(db.exec(`truncate public.${table} cascade`)).rejects.toThrow(
          /permission denied/,
        );
      }
    });
  });
});
