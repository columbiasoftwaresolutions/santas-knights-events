import { Effect, Schema } from "effect";

import { dbCall, DbError, Supabase } from "../supabase";
import { DISCIPLINES } from "./taxonomy";
import { Candidate, SourceError, type Source } from "./types";

// Runs one source: fetch, validate, write each listing in its own transaction,
// and record the run. A bad candidate is counted and skipped; it never stops the run.

export interface RunSummary {
  source: string;
  status: "succeeded" | "partial" | "failed";
  fetched: number;
  matched: number;
  inserted: number;
  updated: number;
  rejected: number;
  error: string | null;
}

const STALE_RUN_MINUTES = 10;

export const runSource = (source: Source) =>
  Effect.gen(function* () {
    const { client } = yield* Supabase;
    const { def } = source;

    // The source row is the provenance every listing and evidence row points at.
    const row = yield* dbCall<{ id: string }>("upsert source", () =>
      client
        .from("sources")
        .upsert(
          {
            slug: def.slug,
            name: def.name,
            url: def.url,
            method: def.method,
            cadence: def.cadence,
            enabled: true,
            verified_at: new Date().toISOString(),
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single(),
    );
    const sourceId = row?.id;
    if (!sourceId)
      return yield* new DbError({ operation: "upsert source", message: "no id returned" });

    // Disciplines are defined in code; make sure each exists before a listing points at it.
    yield* dbCall("ensure disciplines", () =>
      client.from("disciplines").upsert(
        DISCIPLINES.map(([slug, name]) => ({ slug, name })),
        { onConflict: "slug", ignoreDuplicates: true },
      ),
    );

    // A crashed run would block the next one (one running run per source). Close old ones.
    const cutoff = new Date(Date.now() - STALE_RUN_MINUTES * 60_000).toISOString();
    yield* dbCall("close stale runs", () =>
      client
        .from("ingestion_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error: "Run did not finish",
        })
        .eq("source_id", sourceId)
        .eq("status", "running")
        .lt("started_at", cutoff),
    );

    const run = yield* dbCall<{ id: string; started_at: string }>("start run", () =>
      client
        .from("ingestion_runs")
        .insert({ source_id: sourceId })
        .select("id,started_at")
        .single(),
    );
    const runId = run?.id;
    if (!runId) return yield* new DbError({ operation: "start run", message: "no id returned" });

    const finish = (summary: RunSummary) =>
      dbCall("finish run", () =>
        client
          .from("ingestion_runs")
          .update({
            status: summary.status,
            // started_at is stamped by the database clock. If ours runs behind, a quick
            // run would "finish" before it started and break the table's check.
            finished_at: new Date(
              Math.max(Date.now(), Date.parse(run!.started_at) + 1),
            ).toISOString(),
            fetched_count: summary.fetched,
            matched_count: summary.matched,
            inserted_count: summary.inserted,
            updated_count: summary.updated,
            rejected_count: summary.rejected,
            error: summary.error,
          })
          .eq("id", runId),
      ).pipe(Effect.as(summary));

    const collected = yield* Effect.tryPromise({
      try: () => source.collect(),
      catch: () =>
        new SourceError({
          source: def.slug,
          stage: "fetch",
          message: "source_collection_failed",
        }),
    }).pipe(Effect.result);

    if (collected._tag === "Failure") {
      return yield* finish({
        source: def.slug,
        status: "failed",
        fetched: 0,
        matched: 0,
        inserted: 0,
        updated: 0,
        rejected: 0,
        error: collected.failure.message,
      });
    }
    const { fetched, candidates, rejected: skipped } = collected.success;

    let rejected = skipped;
    let firstError: string | null = collected.success.incomplete ? "source_incomplete" : null;
    const valid: Candidate[] = [];
    for (const raw of candidates) {
      const decoded = Schema.decodeUnknownResult(Candidate)(raw);
      if (decoded._tag === "Success") valid.push(decoded.success);
      else {
        rejected++;
        firstError ??= "invalid_candidate";
      }
    }

    // Which listings already exist decides inserted versus updated.
    const keys = valid.map((c) => c.listing.dedupe_key);
    const existing = new Set<string>();
    for (let i = 0; i < keys.length; i += 100) {
      const found = yield* dbCall<{ dedupe_key: string }[]>("find existing", () =>
        client
          .from("listings")
          .select("dedupe_key")
          .eq("source_id", sourceId)
          .in("dedupe_key", keys.slice(i, i + 100)),
      ).pipe(Effect.result);
      if (found._tag === "Failure") {
        return yield* finish({
          source: def.slug,
          status: "failed",
          fetched,
          matched: valid.length,
          inserted: 0,
          updated: 0,
          rejected,
          error: "listing_lookup_failed",
        });
      }
      for (const f of found.success ?? []) existing.add(f.dedupe_key);
    }

    let inserted = 0;
    let updated = 0;
    for (const c of valid) {
      const written = yield* dbCall("ingest listing", () =>
        client.rpc("ingest_listing", {
          p_listing: {
            ...c.listing,
            source_id: sourceId,
            discovered_by: def.method === "curated" ? "curated" : "deterministic",
          },
          p_occurrences: c.occurrences,
          p_evidence: c.evidence,
        }),
      ).pipe(Effect.result);
      if (written._tag === "Success") {
        if (existing.has(c.listing.dedupe_key)) updated++;
        else inserted++;
        existing.add(c.listing.dedupe_key);
      } else {
        rejected++;
        firstError ??= "listing_write_failed";
      }
    }

    return yield* finish({
      source: def.slug,
      status: firstError ? (inserted + updated > 0 ? "partial" : "failed") : "succeeded",
      fetched,
      matched: valid.length,
      inserted,
      updated,
      rejected,
      error: firstError,
    });
  });
