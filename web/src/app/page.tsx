import { Suspense } from "react";
import EventCard from "@/components/EventCard";
import FilterForm from "@/components/FilterForm";
import { getEvents, parseFilters } from "@/lib/events";

type SearchParams = PageProps<"/">["searchParams"];

export default function Home(props: PageProps<"/">) {
  return (
    <main className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Free NYC Events</h1>
        <p className="text-sm text-muted">
          Free events and resources from official NYC sources. Showing sample data.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm">Loading events…</p>}>
        <EventResults searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function EventResults({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const events = await getEvents(filters);

  return (
    <>
      <FilterForm filters={filters} />

      <p className="text-sm text-muted">
        {events.length} {events.length === 1 ? "event" : "events"} found
      </p>

      {events.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </ul>
      ) : (
        <p className="text-muted">No events match these filters.</p>
      )}
    </>
  );
}
