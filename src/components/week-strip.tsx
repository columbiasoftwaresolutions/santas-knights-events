import Link from "next/link";

import { addDays, dayNumber, nyToday, weekdayShort } from "@/lib/dates";
import { toggleHref } from "@/lib/listings/params";
import type { Filters, Listing } from "@/lib/listings/schema";

// Seven days, one square per session. The week's shape is visible before you read a word.
export function WeekStrip({
  listings,
  filters,
}: {
  listings: ReadonlyArray<Listing>;
  filters: Filters;
}) {
  const today = nyToday();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <nav aria-label="Pick a day" className="grid grid-cols-7 border-y-2 border-ink">
      {days.map((day, i) => {
        const sessions = listings.filter((l) => l.day === day);
        const selected = filters.day === day;
        return (
          <Link
            key={day}
            href={toggleHref(filters, "day", day)}
            aria-current={selected ? "date" : undefined}
            className={`relative flex min-h-28 flex-col gap-2 border-l border-rule px-2 pt-3 pb-3 first:border-l-0 sm:px-3 ${
              selected ? "bg-card" : "hover:bg-accent/60"
            }`}
          >
            {selected && (
              <span className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
            )}
            <span className="text-xs font-semibold text-muted-foreground">
              {i === 0 ? "Today" : weekdayShort(day)}
            </span>
            <span className="display text-3xl sm:text-4xl">{dayNumber(day)}</span>
            <span
              className="mt-auto flex flex-wrap gap-1"
              aria-label={`${sessions.length} sessions`}
            >
              {sessions.map((s) => (
                <span
                  key={s.id}
                  className="mark !h-2.5 !w-2.5 !border-[1.5px]"
                  data-status={s.costStatus}
                />
              ))}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
