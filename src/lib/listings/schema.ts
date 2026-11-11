import { Schema } from "effect";

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

export class Evidence extends Schema.Class<Evidence>("sk/Evidence")({
  quote: Schema.String,
  source: Schema.String,
  url: Schema.String,
  checkedOn: Schema.String, // YYYY-MM-DD
}) {}

// What the UI shows for one listing. Real sources are often missing details, so
// anything a source may leave out is nullable. Unknown stays unknown: no field is
// guessed. A listing with no day has no confirmed schedule.
export class Listing extends Schema.Class<Listing>("sk/Listing")({
  id: Schema.String,
  title: Schema.String,
  category: Schema.String,
  discipline: Schema.NullOr(Schema.String),
  description: Schema.String,
  borough: Schema.NullOr(Borough),
  neighborhood: Schema.NullOr(Schema.String),
  venue: Schema.NullOr(Schema.String),
  latitude: Schema.NullOr(Schema.Number),
  longitude: Schema.NullOr(Schema.Number),
  day: Schema.NullOr(Schema.String), // YYYY-MM-DD, New York local date
  startTime: Schema.NullOr(Schema.String), // HH:mm, New York local time
  endTime: Schema.NullOr(Schema.String),
  ages: Schema.NullOr(Schema.String),
  eligibility: Schema.NullOr(Schema.String),
  registrationUrl: Schema.NullOr(Schema.String),
  costStatus: CostStatus,
  // Newest quote supporting costStatus. Null only when nothing backs the claim yet.
  evidence: Schema.NullOr(Evidence),
}) {}

export interface Filters {
  q?: string;
  borough?: Borough;
  discipline?: string;
  cost?: CostStatus;
  day?: string;
}
