import type { Listing } from "./schema";

// Which outbound links a listing shows. Kept apart from the component so the
// rules are testable: sample data never links out, and the evidence link only
// appears when it points somewhere other than the listing's own page.
export interface ListingLinks {
  source: { href: string; label: string } | null;
  register: { href: string; label: string } | null;
  evidenceHref: string | null;
}

export function listingLinks(l: Listing): ListingLinks {
  if (l.isSample) return { source: null, register: null, evidenceHref: null };
  return {
    source: { href: l.sourceUrl, label: `View on ${l.sourceName}` },
    register: l.registrationUrl ? { href: l.registrationUrl, label: "Register" } : null,
    evidenceHref: l.evidence && l.evidence.url !== l.sourceUrl ? l.evidence.url : null,
  };
}
