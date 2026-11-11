// Shape of an event as the UI consumes it. Mirrors the planned Supabase
// `events` table (snake_case columns get mapped to these camelCase fields
// in src/lib/events.ts once the database is wired up).

export const CATEGORIES = [
  "Arts & Culture",
  "Music & Performance",
  "Kids & Family",
  "Fitness & Outdoors",
  "Education & Workshops",
  "Health & Wellness",
  "Community",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;
export type Borough = (typeof BOROUGHS)[number];

export type EventStatus = "scheduled" | "cancelled";

export interface EventLocation {
  venueName: string;
  address: string;
  borough: Borough;
  neighborhood: string | null;
}

export interface EventSource {
  name: string; // e.g. "NYC Parks", "NYPL"
  url: string; // original listing page
}

export interface NycEvent {
  id: string;
  title: string;
  description: string;
  category: Category;
  startsAt: string; // ISO 8601 with offset
  endsAt: string | null;
  location: EventLocation;
  eligibility: string | null; // e.g. "Ages 13–18", "Registration required"
  status: EventStatus;
  source: EventSource;
  lastVerifiedAt: string; // ISO 8601
}

export interface EventFilters {
  q?: string;
  category?: Category;
  borough?: Borough;
  from?: string; // YYYY-MM-DD, NYC local date
  to?: string; // YYYY-MM-DD, NYC local date
}
