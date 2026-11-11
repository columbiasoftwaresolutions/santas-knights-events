import { Effect, Layer } from "effect";

import { ListingRepo } from "./listing-repo";
import { hasReaderConfig, Supabase } from "./supabase";

// The one place that decides which data the running app reads.
//  - LISTINGS_SOURCE=sample forces the invented demo data.
//  - Otherwise the app reads Supabase. Without Supabase settings it falls back to
//    sample data in local development only. A deployed app never shows invented
//    data in place of a missing or unreachable database: it fails loudly.
export function appLayer() {
  const forced = process.env.LISTINGS_SOURCE === "sample";
  const local = process.env.NODE_ENV !== "production" && !process.env.VERCEL;
  if (forced || (local && !hasReaderConfig())) return ListingRepo.sample;
  return ListingRepo.supabase.pipe(Layer.provide(Supabase.reader));
}

export function runServer<A, E>(effect: Effect.Effect<A, E, ListingRepo>): Promise<A> {
  return Effect.runPromise(effect.pipe(Effect.provide(appLayer())));
}
