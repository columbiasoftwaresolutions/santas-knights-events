import type { EvidencePayload, ListingPayload, OccurrencePayload } from "./types";

// Fills the many optional listing fields with null, so each adapter only says what it knows.
export function listingPayload(
  fields: Pick<ListingPayload, "dedupe_key" | "title" | "source_url" | "cost_status"> &
    Partial<ListingPayload>,
): ListingPayload {
  return {
    description: "",
    category_slug: "class",
    discipline_slug: null,
    ages_text: null,
    eligibility: null,
    venue: null,
    address: null,
    borough: null,
    neighborhood: null,
    latitude: null,
    longitude: null,
    schedule_text: null,
    registration_url: null,
    registration_notes: null,
    external_id: null,
    status: "active",
    ...fields,
  };
}

export function occurrence(
  startsAt: string,
  endsAt: string | null,
  key: string | null,
): OccurrencePayload {
  return { starts_at: startsAt, ends_at: endsAt, source_occurrence_key: key, cancelled: false };
}

export type { EvidencePayload };
