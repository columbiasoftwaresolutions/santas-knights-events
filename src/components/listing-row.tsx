import { clock12, shortDate } from "@/lib/dates";
import { listingLinks } from "@/lib/listings/links";
import type { Listing } from "@/lib/listings/schema";

import { CostMark } from "./cost-mark";
import { OutboundLink } from "./outbound-link";
import { buttonVariants } from "./ui/button";

export function ListingRow({ listing: l }: { listing: Listing }) {
  const start = l.startTime ? clock12(l.startTime) : null;
  const end = l.endTime ? clock12(l.endTime) : null;
  const where = [l.venue, l.neighborhood, l.borough].filter(Boolean).join(", ");
  const links = listingLinks(l);

  return (
    <li className="listing-row-grid gap-x-5 border-t border-rule py-5">
      <div className="display text-3xl sm:text-4xl">
        {start ? (
          <>
            {start.clock}
            <span className="ml-0.5 text-base font-bold">{start.meridiem}</span>
            {end && (
              <div className="mt-1 text-sm font-semibold text-muted-foreground">
                to {end.clock} {end.meridiem}
              </div>
            )}
          </>
        ) : (
          <span className="text-xl text-muted-foreground">Time TBC</span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="font-heading text-xl leading-tight font-bold">{l.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {[where, l.ages].filter(Boolean).join(". ") || "Location not listed"}
          {where || l.ages ? "." : ""}
        </p>
        {l.eligibility && <p className="mt-1 text-sm">{l.eligibility}</p>}

        <div className="mt-3 text-sm">
          <CostMark status={l.costStatus} />
          {l.evidence ? (
            <blockquote className="mt-1.5 border-l-2 border-primary pl-3 text-foreground/85">
              &ldquo;{l.evidence.quote}&rdquo;
              <footer className="mt-0.5 text-xs text-muted-foreground">
                {links.evidenceHref ? (
                  <OutboundLink href={links.evidenceHref}>{l.evidence.source}</OutboundLink>
                ) : (
                  l.evidence.source
                )}
                , checked {shortDate(l.evidence.checkedOn)}
              </footer>
            </blockquote>
          ) : (
            <p className="mt-1.5 border-l-2 border-dashed border-input pl-3 text-muted-foreground">
              No source text yet. Check with the organizer before you go.
            </p>
          )}
        </div>

        {links.source || links.register || l.registrationNotes ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {links.register && (
              <OutboundLink
                href={links.register.href}
                className={buttonVariants({ size: "sm" }) + " no-underline"}
              >
                {links.register.label}
              </OutboundLink>
            )}
            {l.registrationNotes && (
              <span className="text-muted-foreground">{l.registrationNotes}</span>
            )}
            {links.source && (
              <OutboundLink href={links.source.href} className="font-semibold text-primary">
                {links.source.label}
              </OutboundLink>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}
