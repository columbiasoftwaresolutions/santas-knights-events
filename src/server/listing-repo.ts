import { Context, Effect, Layer, Schema } from "effect";
import { nyToday } from "@/lib/dates";
import { sampleRows } from "@/lib/listings/sample";
import { Listing, type Filters } from "@/lib/listings/schema";

// Everything the pages know about data goes through this service. The sample
// layer below is swapped for a Supabase layer without touching any page.

export class ListingRepoError extends Schema.TaggedError<ListingRepoError>()(
  "ListingRepoError",
  { cause: Schema.Defect() },
) {}

export class ListingRepo extends Context.Service<
  ListingRepo,
  {
    search(filters: Filters): Effect.Effect<ReadonlyArray<Listing>, ListingRepoError>;
  }
>()("sk/server/ListingRepo") {
  static readonly sample = Layer.effect(
    ListingRepo,
    Effect.sync(() => {
      const decode = Schema.decodeUnknownEffect(Schema.Array(Listing));

      const search = Effect.fn("ListingRepo.search")(function* (filters: Filters) {
        const all = yield* decode(sampleRows(nyToday())).pipe(
          Effect.mapError((cause) => new ListingRepoError({ cause })),
        );
        const q = filters.q?.toLowerCase();
        return all
          .filter((l) => !filters.borough || l.borough === filters.borough)
          .filter((l) => !filters.discipline || l.discipline === filters.discipline)
          .filter((l) => !filters.cost || l.costStatus === filters.cost)
          .filter((l) => !filters.day || l.day === filters.day)
          .filter(
            (l) =>
              !q ||
              [l.title, l.discipline, l.venue, l.neighborhood, l.borough]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q),
          )
          // Unscheduled listings go last.
          .toSorted((a, b) =>
            `${a.day ?? "9999"}${a.startTime ?? ""}`.localeCompare(`${b.day ?? "9999"}${b.startTime ?? ""}`),
          );
      });

      return ListingRepo.of({ search });
    }),
  );
}
