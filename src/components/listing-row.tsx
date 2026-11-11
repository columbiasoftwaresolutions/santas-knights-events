import { clock12, shortDate } from "@/lib/dates";
import type { Listing } from "@/lib/listings/schema";
import { CostMark } from "./cost-mark";

export function ListingRow({ listing: l }: { listing: Listing }) {
  const start = clock12(l.startTime);
  const end = clock12(l.endTime);
  return (
    <li className="grid grid-cols-[4.75rem_1fr] gap-x-5 border-t border-rule py-5 sm:grid-cols-[6.5rem_1fr]">
      <div className="display text-3xl sm:text-4xl">
        {start.clock}
        <span className="ml-0.5 text-base font-bold">{start.meridiem}</span>
        <div className="mt-1 text-sm font-semibold text-muted-foreground">
          to {end.clock} {end.meridiem}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="font-heading text-xl font-bold leading-tight">{l.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {l.venue}, {l.neighborhood}, {l.borough}. {l.ages}.
        </p>

        <div className="mt-3 text-sm">
          <CostMark status={l.costStatus} />
          <blockquote className="mt-1.5 border-l-2 border-primary pl-3 text-foreground/85">
            &ldquo;{l.evidence.quote}&rdquo;
            <footer className="mt-0.5 text-xs text-muted-foreground">
              {l.evidence.source}, checked {shortDate(l.evidence.checkedOn)}
            </footer>
          </blockquote>
        </div>
      </div>
    </li>
  );
}
