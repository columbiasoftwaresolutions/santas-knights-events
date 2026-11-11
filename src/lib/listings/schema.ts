import { Schema } from "effect";

// Domain model for what the UI consumes. The Supabase layer will decode rows
// into these same classes, so pages never see database shapes.

export const BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;
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

export class Listing extends Schema.Class<Listing>("sk/Listing")({
  id: Schema.String,
  title: Schema.String,
  discipline: Schema.String,
  description: Schema.String,
  borough: Borough,
  neighborhood: Schema.String,
  venue: Schema.String,
  day: Schema.String, // YYYY-MM-DD, New York local date
  startTime: Schema.String, // HH:mm, New York local time
  endTime: Schema.String,
  ages: Schema.String,
  costStatus: CostStatus,
  evidence: Evidence,
}) {}

export interface Filters {
  q?: string;
  borough?: Borough;
  discipline?: string;
  cost?: CostStatus;
  day?: string;
}
