import { Context, Effect, Layer, Schema } from "effect";

import { nyToday } from "@/lib/dates";
import { buildDirectory, filterListings, type Directory } from "@/lib/listings/directory";
import { sampleRows } from "@/lib/listings/sample";
import { Listing, type Filters } from "@/lib/listings/schema";

// Everything the pages know about data goes through this service. The sample
// layer below is swapped for a Supabase layer without touching any page.

export class ListingRepoError extends Schema.TaggedError<ListingRepoError>()("ListingRepoError", {
  cause: Schema.Defect(),
}) {}

export class ListingRepo extends Context.Service<
  ListingRepo,
  {
    // Matching sessions only.
    search(filters: Filters): Effect.Effect<ReadonlyArray<Listing>, ListingRepoError>;
    // Everything the directory page shows, from one read.
    directory(filters: Filters): Effect.Effect<Directory, ListingRepoError>;
  }
>()("sk/server/ListingRepo") {
  static readonly sample = Layer.effect(
    ListingRepo,
    Effect.sync(() => {
      const decode = Schema.decodeUnknownEffect(Schema.Array(Listing));
      const loadAll = Effect.fn("ListingRepo.sample.load")(function* () {
        return yield* decode(sampleRows(nyToday())).pipe(
          Effect.mapError((cause) => new ListingRepoError({ cause })),
        );
      });

      return ListingRepo.of({
        search: Effect.fn("ListingRepo.search")(function* (filters: Filters) {
          return filterListings(yield* loadAll(), filters);
        }),
        directory: Effect.fn("ListingRepo.directory")(function* (filters: Filters) {
          return buildDirectory(yield* loadAll(), filters);
        }),
      });
    }),
  );
}
