import { Context, Effect, Layer, Schema } from "effect";

import { nyToday } from "@/lib/dates";
import { buildDirectory, filterListings, type Directory } from "@/lib/listings/directory";
import { sampleRows } from "@/lib/listings/sample";
import { Listing, type Filters } from "@/lib/listings/schema";

import { LISTING_SELECT, projectListings, type ListingRow } from "./listing-rows";
import { dbCall, Supabase } from "./supabase";

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

  // The real directory: active listings read with the public key, so RLS applies.
  static readonly supabase = Layer.effect(
    ListingRepo,
    Effect.gen(function* () {
      const { client } = yield* Supabase;
      const decodeOne = Schema.decodeUnknownEffect(Listing);

      const loadAll = Effect.fn("ListingRepo.supabase.load")(function* () {
        const data = yield* dbCall<unknown>("read listings", () =>
          client.from("listings").select(LISTING_SELECT).eq("status", "active").limit(2000),
        ).pipe(Effect.mapError((cause) => new ListingRepoError({ cause })));
        // The select string is built at runtime, so supabase-js cannot type it. The rows
        // are checked field by field when each session is decoded below.
        const sessions = projectListings((data ?? []) as ListingRow[], nyToday());
        // One malformed row must not blank the directory. It is logged and skipped.
        const decoded = yield* Effect.forEach(sessions, (s) =>
          decodeOne(s).pipe(
            Effect.map((l): Listing | null => l),
            Effect.catch((error) =>
              Effect.sync(() => {
                console.error("Skipped a listing that failed validation", String(error));
                return null;
              }),
            ),
          ),
        );
        return decoded.filter((l): l is Listing => l !== null);
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
