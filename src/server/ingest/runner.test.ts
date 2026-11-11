import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { Supabase } from "../supabase";
import { listingPayload } from "./build";
import { runSource } from "./runner";
import type { SourceResult } from "./types";

// A small database boundary double. Assert persisted run outcomes, not query order.
function database(lookupFails = false) {
  let finished: Record<string, unknown> | undefined;
  const client = {
    from(table: string) {
      let action = "read";
      let value: Record<string, unknown> | undefined;
      const query = {
        upsert() {
          action = "upsert";
          return query;
        },
        insert() {
          action = "insert";
          return query;
        },
        update(payload: Record<string, unknown>) {
          action = "update";
          value = payload;
          return query;
        },
        select() {
          return query;
        },
        single() {
          return query;
        },
        eq() {
          return query;
        },
        lt() {
          return query;
        },
        in() {
          return query;
        },
        then(resolve: (value: unknown) => unknown) {
          if (
            table === "ingestion_runs" &&
            action === "update" &&
            value?.fetched_count !== undefined
          )
            finished = value;
          const data =
            table === "sources"
              ? { id: "source" }
              : table === "ingestion_runs" && action === "insert"
                ? { id: "run", started_at: "2026-11-11T00:00:00Z" }
                : [];
          return Promise.resolve({
            data,
            error:
              table === "listings" && lookupFails ? { message: "private database detail" } : null,
          }).then(resolve);
        },
      };
      return query;
    },
    rpc() {
      return Promise.resolve({ data: "listing", error: null });
    },
  } as unknown as SupabaseClient;
  return { layer: Layer.succeed(Supabase, { client }), finished: () => finished };
}
const candidate = {
  listing: listingPayload({
    dedupe_key: "test:one",
    title: "Boxing",
    source_url: "https://example.org/class",
    cost_status: "unverified",
  }),
  occurrences: [],
  evidence: [],
};
const source = (collect: () => Promise<SourceResult>) => ({
  def: {
    slug: "test",
    name: "Test source",
    url: "https://example.org",
    method: "feed" as const,
    cadence: "daily",
  },
  collect,
});

describe("ingestion run outcomes", () => {
  it("retains collected listings but records an incomplete scan as partial", async () => {
    const db = database();
    const summary = await Effect.runPromise(
      runSource(
        source(async () => ({
          fetched: 1,
          rejected: 0,
          candidates: [candidate],
          fetchedAt: "2026-11-11T00:00:00Z",
          incomplete: true,
        })),
      ).pipe(Effect.provide(db.layer)),
    );
    expect(summary.status).toBe("partial");
    expect(summary.inserted).toBe(1);
    expect(db.finished()?.status).toBe("partial");
  });

  it("finishes a run after a lookup failure without exposing database details", async () => {
    const db = database(true);
    const summary = await Effect.runPromise(
      runSource(
        source(async () => ({
          fetched: 1,
          rejected: 0,
          candidates: [candidate],
          fetchedAt: "2026-11-11T00:00:00Z",
        })),
      ).pipe(Effect.provide(db.layer)),
    );
    expect(db.finished()?.status).toBe("failed");
    expect(summary.inserted).toBe(0);
    expect(JSON.stringify(summary)).not.toContain("private database detail");
  });

  it("finishes a failed collection without exposing upstream details", async () => {
    const db = database();
    await Effect.runPromise(
      runSource(
        source(async () => {
          throw new Error("private upstream detail");
        }),
      ).pipe(Effect.provide(db.layer)),
    );
    expect(db.finished()?.status).toBe("failed");
    expect(JSON.stringify(db.finished())).not.toContain("private upstream detail");
  });
});
