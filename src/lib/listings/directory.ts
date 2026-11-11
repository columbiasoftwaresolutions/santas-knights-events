import { isFreeStatus, type Filters, type Listing } from "./schema";

// Pure filtering and counting. The page needs the results, the week strip (every
// day, so it ignores the day filter) and counts for each facet. Each facet is
// counted with every filter except its own, so a count is what a click would show.

export interface Directory {
  results: ReadonlyArray<Listing>;
  forWeek: ReadonlyArray<Listing>;
  counts: {
    cost: Record<string, number>;
    borough: Record<string, number>;
    discipline: Record<string, number>;
  };
}

export function filterListings(all: ReadonlyArray<Listing>, filters: Filters): Listing[] {
  const q = filters.q?.toLowerCase();
  return all
    .filter((l) => !filters.borough || l.borough === filters.borough)
    .filter((l) => !filters.discipline || l.discipline === filters.discipline)
    .filter((l) =>
      filters.cost === "any"
        ? true
        : filters.cost
          ? l.costStatus === filters.cost
          : isFreeStatus(l.costStatus),
    )
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
    .toSorted((a, b) =>
      `${a.day ?? "9999"}${a.startTime ?? ""}`.localeCompare(
        `${b.day ?? "9999"}${b.startTime ?? ""}`,
      ),
    );
}

function countBy(items: ReadonlyArray<Listing>, pick: (l: Listing) => string | null) {
  const counts: Record<string, number> = {};
  for (const l of items) {
    const key = pick(l);
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function buildDirectory(all: ReadonlyArray<Listing>, filters: Filters): Directory {
  return {
    results: filterListings(all, filters),
    forWeek: filterListings(all, { ...filters, day: undefined }),
    counts: {
      cost: countBy(filterListings(all, { ...filters, cost: "any" }), (l) => l.costStatus),
      borough: countBy(filterListings(all, { ...filters, borough: undefined }), (l) => l.borough),
      discipline: countBy(
        filterListings(all, { ...filters, discipline: undefined }),
        (l) => l.discipline,
      ),
    },
  };
}
