import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatEventDate, formatTimestamp } from "@/lib/dates";
import { getEventById } from "@/lib/events";

type Params = PageProps<"/events/[id]">["params"];

export default function EventPage(props: PageProps<"/events/[id]">) {
  return (
    <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-4">
      <Link href="/" className="text-sm text-muted underline hover:text-red">
        ← All events
      </Link>

      <Suspense fallback={<p className="text-sm">Loading event…</p>}>
        <EventDetails params={props.params} />
      </Suspense>
    </main>
  );
}

async function EventDetails({ params }: { params: Params }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const { location } = event;

  return (
    <>
      {event.status === "cancelled" && (
        <p className="border border-red-deep bg-red-deep text-white font-semibold rounded p-3 text-sm">
          This event has been cancelled.
        </p>
      )}

      <div>
        <span className="text-xs bg-gold-soft rounded px-1.5 py-0.5">{event.category}</span>
        <h1 className="font-display text-3xl font-bold tracking-tight mt-2">{event.title}</h1>
      </div>

      <dl className="bg-card border border-line rounded p-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm [&>dt]:text-muted">
        <dt className="font-semibold">When</dt>
        <dd>{formatEventDate(event.startsAt, event.endsAt)}</dd>

        <dt className="font-semibold">Where</dt>
        <dd>
          {location.venueName}
          <br />
          {location.address}
          <br />
          {[location.neighborhood, location.borough].filter(Boolean).join(", ")}
        </dd>

        <dt className="font-semibold">Cost</dt>
        <dd className="text-green font-semibold">Free</dd>

        <dt className="font-semibold">Eligibility</dt>
        <dd>{event.eligibility ?? "Open to all"}</dd>

        <dt className="font-semibold">Source</dt>
        <dd>
          <a
            href={event.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-red"
          >
            {event.source.name}
          </a>
        </dd>

        <dt className="font-semibold">Last verified</dt>
        <dd>{formatTimestamp(event.lastVerifiedAt)}</dd>
      </dl>

      <p className="whitespace-pre-line">{event.description}</p>
    </>
  );
}
