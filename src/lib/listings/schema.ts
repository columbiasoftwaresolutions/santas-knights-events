import { Schema } from "effect";

import { HttpUrl } from "./url";

// Domain model for what the UI consumes. The Supabase layer will decode rows
// into these same classes, so pages never see database shapes.

export const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const;
export const Borough = Schema.Literals(BOROUGHS);
export type Borough = typeof Borough.Type;

// A listing is only shown as free when `evidence` backs it up.
export const COST_STATUSES = [
  "free",
  "free_with_registration",
  "free_trial_only",
  "sliding_scale",
  "unverified",
] as const;
export const CostStatus = Schema.Literals(COST_STATUSES);
export type CostStatus = typeof CostStatus.Type;

export const COST_LABEL: Record<CostStatus, string> = {
  free: "Free",
  free_with_registration: "Free, registration needed",
  free_trial_only: "Free trial only",
  sliding_scale: "Sliding scale",
  unverified: "Cost not confirmed",
};

const NonBlank = Schema.String.check(
  Schema.makeFilter((s: string) => s.trim() !== "" || "Must not be blank"),
);

// Validate without throwing, including invalid months and leap days.
export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const date = new Date(`${s}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(s);
}
export const IsoDate = Schema.String.check(
  Schema.makeFilter((s: string) => isIsoDate(s) || "Expected a real date as YYYY-MM-DD"),
);

// HH:mm on a 24-hour clock.
export const ClockTime = Schema.String.check(
  Schema.makeFilter(
    (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s) || "Expected a time as HH:mm",
  ),
);

export class Evidence extends Schema.Class<Evidence>("sk/Evidence")({
  quote: NonBlank,
  source: NonBlank,
  // The cost claim this quote supports. A "free" listing needs a quote for "free".
  supports: CostStatus,
  // Page the quote was captured from. May differ from the listing's own page.
  url: HttpUrl,
  checkedOn: IsoDate,
}) {}

export const isFreeStatus = (status: CostStatus) =>
  status === "free" || status === "free_with_registration";

// What the UI shows for one session of a listing. Real sources are often missing
// details, so anything a source may leave out is nullable. Unknown stays unknown:
// no field is guessed. A listing with no day has no confirmed schedule.
const ListingFields = Schema.Struct({
  // Listing id, shared by all of a listing's sessions.
  id: Schema.String,
  // Unique per session, so it is the React key. Use it, not `id`, to key lists.
  sessionId: Schema.String,
  title: Schema.String,
  category: Schema.String,
  discipline: Schema.NullOr(Schema.String),
  description: Schema.String,
  borough: Schema.NullOr(Borough),
  neighborhood: Schema.NullOr(Schema.String),
  venue: Schema.NullOr(Schema.String),
  address: Schema.optionalKey(Schema.NullOr(Schema.String)),
  scheduleText: Schema.optionalKey(Schema.NullOr(Schema.String)),
  latitude: Schema.NullOr(Schema.Number),
  longitude: Schema.NullOr(Schema.Number),
  day: Schema.NullOr(IsoDate), // New York local date
  startTime: Schema.NullOr(ClockTime), // New York local time
  endTime: Schema.NullOr(ClockTime),
  ages: Schema.NullOr(Schema.String),
  eligibility: Schema.NullOr(Schema.String),
  // Where to act (book or register). Often a third-party site.
  registrationUrl: Schema.NullOr(HttpUrl),
  registrationNotes: Schema.NullOr(Schema.String),
  // The official page for this listing, and who published it.
  sourceName: NonBlank,
  sourceUrl: HttpUrl,
  // True for invented demo data. Its URLs are placeholders and are never shown as links.
  isSample: Schema.Boolean,
  costStatus: CostStatus,
  // Newest quote supporting costStatus. Null only when nothing backs the claim yet.
  evidence: Schema.NullOr(Evidence),
}).check(
  Schema.makeFilter(
    (l) =>
      !isFreeStatus(l.costStatus) ||
      (l.evidence !== null && l.evidence.supports === l.costStatus) ||
      "A free listing needs evidence that supports that exact status",
  ),
);

export class Listing extends Schema.Class<Listing>("sk/Listing")(ListingFields) {}

export interface Filters {
  q?: string;
  borough?: Borough;
  discipline?: string;
  // Unset shows only free listings. "any" shows every cost status, for counts.
  cost?: CostStatus | "any";
  day?: string;
}
