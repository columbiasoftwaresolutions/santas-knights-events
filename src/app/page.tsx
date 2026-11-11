import { Effect } from "effect";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { FilterColumn, type Facet } from "@/components/filter-column";
import { ListingRow } from "@/components/listing-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WeekStrip } from "@/components/week-strip";
import { longDay } from "@/lib/dates";
import { hrefFor, parseFilters } from "@/lib/listings/params";
import {
  BOROUGHS,
  COST_LABEL,
  COST_STATUSES,
  type Filters,
  type Listing,
} from "@/lib/listings/schema";
import { ListingRepo } from "@/server/listing-repo";
import { runServer } from "@/server/run";

const load = (filters: Filters) =>
  Effect.gen(function* () {
    const repo = yield* ListingRepo;
    return yield* repo.search(filters);
  });

function countBy(items: ReadonlyArray<Listing>, pick: (l: Listing) => string | null) {
  const m = new Map<string, number>();
  for (const l of items) {
    const key = pick(l);
    if (key) m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}

const Title = () => (
  <h1 className="display text-5xl sm:text-6xl">
    Free martial arts
    <br />
    in New York City
  </h1>
);

// The page frame renders instantly. The listings depend on today's date and the URL, so they stream in.
export default function Home(props: PageProps<"/">) {
  return (
    <Suspense
      fallback={
        <header className="border-b border-rule">
          <div className="mx-auto w-full max-w-6xl px-5 pt-7 pb-5">
            <Title />
          </div>
        </header>
      }
    >
      <Directory searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Directory({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  await connection();
  const filters = parseFilters(await searchParams);

  // Each facet is counted with every filter except its own, so counts show what a click would give.
  const without = (k: keyof Filters): Filters => ({ ...filters, [k]: undefined });
  const [results, forWeek, forBorough, forDiscipline, forCost] = await runServer(
    Effect.all([
      load(filters),
      load(without("day")),
      load(without("borough")),
      load(without("discipline")),
      // Counts for every cost status, so Cost shows what a click would add.
      load({ ...filters, cost: "any" }),
    ]),
  );

  const boroughCount = countBy(forBorough, (l) => l.borough);
  const disciplineCount = countBy(forDiscipline, (l) => l.discipline);
  const costCount = countBy(forCost, (l) => l.costStatus);

  const facets: Facet[] = [
    {
      key: "cost",
      title: "Cost",
      options: COST_STATUSES.map((s) => ({
        value: s,
        label: COST_LABEL[s],
        count: costCount.get(s) ?? 0,
      })),
    },
    {
      key: "borough",
      title: "Borough",
      options: BOROUGHS.map((b) => ({ value: b, label: b, count: boroughCount.get(b) ?? 0 })),
    },
    {
      key: "discipline",
      title: "Discipline",
      options: [...disciplineCount.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([d, n]) => ({ value: d, label: d, count: n })),
    },
  ];

  const byDay = Map.groupBy(results, (l) => l.day ?? "unscheduled");
  const active = Object.values(filters).some(Boolean);

  return (
    <>
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-x-10 gap-y-4 px-5 pt-7 pb-5">
          <Title />
          <form action="/" className="flex w-full max-w-sm gap-2 sm:w-auto sm:min-w-80">
            {Object.entries(filters).map(([k, v]) =>
              v && k !== "q" ? <input key={k} type="hidden" name={k} value={v} /> : null,
            )}
            <div className="flex-1">
              <Input
                name="q"
                defaultValue={filters.q}
                placeholder="Judo, Harlem, tai chi"
                aria-label="Search listings"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-6 pb-16">
        <WeekStrip listings={forWeek} filters={filters} />

        <div className="mt-8 grid directory-grid gap-10">
          <aside>
            <details className="group md:hidden">
              <summary className="cursor-pointer border-y-2 border-ink py-2 font-heading text-base font-bold marker:content-none">
                Filters
                <span className="float-right text-sm font-semibold text-muted-foreground group-open:hidden">
                  {active ? "On" : "Off"}
                </span>
              </summary>
              <div className="pt-5">
                <FilterColumn facets={facets} filters={filters} />
              </div>
            </details>
            <div className="hidden md:block">
              <FilterColumn facets={facets} filters={filters} />
            </div>
          </aside>

          <section aria-label="Results">
            <p className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "session" : "sessions"}
              {active && (
                <>
                  {" "}
                  <Link
                    href="/"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    Clear filters
                  </Link>
                </>
              )}
              <span className="float-right">Sample data: invented listings, no source links</span>
            </p>

            {results.length === 0 ? (
              <div className="mt-6 border-t-2 border-ink py-8">
                <p className="font-heading text-xl font-bold">Nothing matches that combination.</p>
                <p className="mt-1 text-muted-foreground">
                  Remove a filter, or{" "}
                  <Link
                    href={hrefFor({})}
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    see the whole week
                  </Link>
                  .
                </p>
              </div>
            ) : (
              [...byDay.entries()].map(([day, rows]) => (
                <div key={day} className="mt-6">
                  <h2 className="border-b-2 border-ink pb-1 font-heading text-lg font-bold">
                    {day === "unscheduled" ? "Schedule not confirmed" : longDay(day)}
                  </h2>
                  <ul>
                    {rows.map((l) => (
                      <ListingRow key={l.sessionId} listing={l} />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </>
  );
}
