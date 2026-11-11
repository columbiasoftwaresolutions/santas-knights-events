import Link from "next/link";
import { formatEventDate } from "@/lib/dates";
import type { NycEvent } from "@/lib/types";

export default function EventCard({ event }: { event: NycEvent }) {
  const { location } = event;
  const cancelled = event.status === "cancelled";

  return (
    <li className="bg-card border border-line hover:border-line-strong rounded p-4 flex flex-col gap-1.5">
      <div className="text-xs flex flex-wrap items-center gap-2">
        <span className="bg-gold-soft text-ink rounded px-1.5 py-0.5">{event.category}</span>
        <span className="text-muted">{location.borough}</span>
        {cancelled ? (
          <span className="bg-red-deep text-white font-semibold rounded px-1.5 py-0.5">
            Cancelled
          </span>
        ) : (
          <span className="bg-green-soft text-green font-semibold rounded px-1.5 py-0.5">Free</span>
        )}
      </div>

      <h2
        className={`font-display text-lg font-semibold leading-snug ${cancelled ? "line-through text-muted" : ""}`}
      >
        <Link href={`/events/${event.id}`} className="hover:text-red">
          {event.title}
        </Link>
      </h2>

      <p className="text-sm font-medium">{formatEventDate(event.startsAt, event.endsAt)}</p>
      <p className="text-sm">
        {location.venueName}
        {location.neighborhood && <span className="text-muted"> — {location.neighborhood}</span>}
      </p>
      <p className="text-sm text-muted line-clamp-2">{event.description}</p>

      <p className="text-xs text-muted mt-auto pt-1">
        Source:{" "}
        <a
          href={event.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-red"
        >
          {event.source.name}
        </a>
      </p>
    </li>
  );
}
