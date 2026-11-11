import Link from "next/link";

import { longDay } from "@/lib/dates";
import { activeFilters } from "@/lib/listings/active-filters";
import { hrefFor } from "@/lib/listings/params";
import type { Filters } from "@/lib/listings/schema";

function headline(filters: Filters, noFilters: boolean) {
  const noun = filters.cost ? "sessions" : "free sessions";
  if (filters.q) return `No ${noun} match “${filters.q}”.`;
  if (filters.day) return `No ${noun} on ${longDay(filters.day)}.`;
  if (noFilters) return "No free sessions are listed for the next 7 days.";
  return `No ${noun} match these filters.`;
}

// Says what came up empty and offers to undo one filter at a time, so a visitor
// keeps the choices that were not the problem.
export function EmptyState({ filters }: { filters: Filters }) {
  const active = activeFilters(filters);
  return (
    <div className="mt-6 border-t-2 border-ink py-8">
      <p className="font-heading text-xl font-bold">{headline(filters, active.length === 0)}</p>
      {active.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {active.map((a) => (
            <li key={a.key}>
              <Link
                href={hrefFor({ ...filters, [a.key]: undefined })}
                className="font-semibold text-primary underline underline-offset-4"
              >
                Remove {a.label}
              </Link>
            </li>
          ))}
          {active.length > 1 && (
            <li>
              <Link href="/" className="font-semibold text-primary underline underline-offset-4">
                Clear all filters
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
