import { timingSafeEqual } from "node:crypto";

import { Effect } from "effect";

import { SOURCES } from "@/server/ingest/registry";
import { runSource } from "@/server/ingest/runner";
import { Supabase } from "@/server/supabase";

// Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. Nothing runs, and
// no privileged client is created, unless that secret is set and matches.
// The Parks recreation-center scan is slow on purpose (a pause between requests).
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const slug = new URL(request.url).searchParams.get("source") ?? "";
  const make = SOURCES[slug];
  if (!make) {
    return Response.json({ error: "unknown source", known: Object.keys(SOURCES) }, { status: 400 });
  }

  const outcome = await Effect.runPromise(
    runSource(make()).pipe(Effect.provide(Supabase.admin), Effect.result),
  );
  if (outcome._tag === "Failure") {
    // Never return raw database/upstream messages or credentials.
    return Response.json(
      { source: slug, status: "failed", error: "ingestion_failed" },
      { status: 500 },
    );
  }
  return Response.json(outcome.success, {
    status: outcome.success.status === "succeeded" ? 200 : 503,
  });
}
