import { Effect } from "effect";

import { ListingRepo } from "./listing-repo";

// The one place that decides which layers the running app uses.
export const AppLayer = ListingRepo.sample;

export function runServer<A, E>(effect: Effect.Effect<A, E, ListingRepo>): Promise<A> {
  return Effect.runPromise(effect.pipe(Effect.provide(AppLayer)));
}
