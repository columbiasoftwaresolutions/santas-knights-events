import { Effect } from "effect";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { FilterColumn, type Facet } from "@/components/filter-column";
import { ListingRow } from "@/components/listing-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WeekStrip } from "@/components/week-strip";
import { longDay } from "@/lib/dates";
import { activeFilters, DEFAULT_SCOPE, filterSummary } from "@/lib/listings/active-filters";
import { parseFilters } from "@/lib/listings/params";
import { BOROUGHS, COST_LABEL, COST_STATUSES, type Filters } from "@/lib/listings/schema";
import { ListingRepo } from "@/server/listing-repo";
import { runServer } from "@/server/run";

const load = (filters: Filters) =>
  Effect.gen(function* () {
    const repo = yield* ListingRepo;
    return yield* repo.directory(filters);
  });

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
  const { results, forWeek, counts } = await runServer(load(filters));

  const freeCount = (counts.cost.free ?? 0) + (counts.cost.free_with_registration ?? 0);
  const facets: Facet[] = [
    {
      key: "cost",
      title: "Cost",
      options: [
        { value: "", label: DEFAULT_SCOPE, count: freeCount },
        ...COST_STATUSES.map((s) => ({
          value: s,
          label: COST_LABEL[s],
          count: counts.cost[s] ?? 0,
          status: s,
        })),
      ],
    },
    {
      key: "borough",
      title: "Borough",
      options: BOROUGHS.map((b) => ({ value: b, label: b, count: counts.borough[b] ?? 0 })),
    },
    {
      key: "discipline",
      title: "Discipline",
      options: Object.entries(counts.discipline)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([d, n]) => ({ value: d, label: d, count: n })),
    },
  ];

  const byDay = Map.groupBy(results, (l) => l.day ?? "unscheduled");
  const undated = byDay.get("unscheduled")?.length ?? 0;
  const dated = results.length - undated;
  const hasFilters = activeFilters(filters).length > 0;

  return (
    <>
      <a href="#results" className="sr-only focus:not-sr-only focus:p-3">
        Skip to results
      </a>
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-x-10 gap-y-4 px-5 pt-7 pb-5">
          <Title />
          <search>
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
          </search>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-6 pb-16">
        <WeekStrip listings={forWeek} filters={filters} />

        <div className="mt-8 grid directory-grid gap-10">
          <aside>
            <details className="group lg:hidden">
              <summary className="flex cursor-pointer items-baseline justify-between gap-3 border-y-2 border-ink py-2 marker:content-none">
                <span className="font-heading text-base font-bold">Filters</span>
                <span className="min-w-0 truncate text-sm text-muted-foreground group-open:hidden">
                  {filterSummary(filters)}
                </span>
                <span className="ml-auto text-sm font-semibold" aria-hidden="true">
                  <span className="group-open:hidden">Show</span>
                  <span className="hidden group-open:inline">Hide</span>
                </span>
              </summary>
              <div className="pt-5">
                <FilterColumn facets={facets} filters={filters} idPrefix="m" />
              </div>
            </details>
            <div className="hidden lg:block">
              <FilterColumn facets={facets} filters={filters} idPrefix="d" />
            </div>
          </aside>

          <section id="results" aria-label="Results" tabIndex={-1}>
            <p className="text-sm text-muted-foreground">
              {dated} {dated === 1 ? "session" : "sessions"} this week
              {undated > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <a href="#unscheduled" className="underline underline-offset-4">
                    {undated} {undated === 1 ? "program" : "programs"} with schedules to confirm
                  </a>
                </>
              )}
              {hasFilters && (
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
            </p>
            {[...results, ...forWeek].some((l) => l.isSample) && (
              <p className="mt-1 text-xs text-muted-foreground">
                Sample data: invented listings, no source links.
              </p>
            )}

            {results.length === 0 ? (
              <EmptyState filters={filters} />
            ) : (
              [...byDay.entries()].map(([day, rows]) => (
                <div
                  key={day}
                  id={day === "unscheduled" ? "unscheduled" : undefined}
                  className="mt-6"
                >
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
