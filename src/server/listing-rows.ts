import { addDays, nyLocal } from "@/lib/dates";
import { BOROUGHS } from "@/lib/listings/schema";

// Turns the rows the database returns into the sessions the page shows. Pure, so it
// is tested without a database.

export const LISTING_SELECT = [
  "id,title,description,ages_text,eligibility,venue,borough,neighborhood,latitude,longitude",
  "cost_status,registration_url,registration_notes,source_url",
  "category:categories(name)",
  "discipline:disciplines(name)",
  "source:sources(name)",
  "listing_occurrences(id,starts_at,ends_at,cancelled)",
  "listing_evidence(quote,url,captured_at,supports_cost_status,source:sources(name))",
].join(",");

export interface ListingRow {
  id: string;
  title: string;
  description: string | null;
  ages_text: string | null;
  eligibility: string | null;
  venue: string | null;
  borough: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  cost_status: string;
  registration_url: string | null;
  registration_notes: string | null;
  source_url: string;
  category: { name: string } | null;
  discipline: { name: string } | null;
  source: { name: string } | null;
  listing_occurrences: {
    id: string;
    starts_at: string;
    ends_at: string | null;
    cancelled: boolean;
  }[];
  listing_evidence: {
    quote: string;
    url: string;
    captured_at: string;
    supports_cost_status: string;
    source: { name: string } | null;
  }[];
}

// The week the strip shows: today and the six days after.
export const WINDOW_DAYS = 7;

export function projectListings(rows: ReadonlyArray<ListingRow>, today: string): unknown[] {
  const lastDay = addDays(today, WINDOW_DAYS - 1);
  return rows.flatMap((row): unknown[] => {
    const evidenceRow = [...row.listing_evidence]
      .filter((e) => e.supports_cost_status === row.cost_status)
      .sort((a, b) => b.captured_at.localeCompare(a.captured_at))[0];
    const base = {
      id: row.id,
      title: row.title,
      category: row.category?.name ?? "Class",
      discipline: row.discipline?.name ?? null,
      description: row.description ?? "",
      borough: BOROUGHS.find((b) => b === row.borough) ?? null,
      neighborhood: row.neighborhood,
      venue: row.venue,
      latitude: row.latitude,
      longitude: row.longitude,
      ages: row.ages_text,
      eligibility: row.eligibility,
      registrationUrl: row.registration_url,
      registrationNotes: row.registration_notes,
      sourceName: row.source?.name ?? "Source",
      sourceUrl: row.source_url,
      isSample: false,
      costStatus: row.cost_status,
      evidence: evidenceRow
        ? {
            quote: evidenceRow.quote,
            source: evidenceRow.source?.name ?? row.source?.name ?? "Source",
            supports: evidenceRow.supports_cost_status,
            url: evidenceRow.url,
            checkedOn: nyLocal(evidenceRow.captured_at).day,
          }
        : null,
    };

    const live = row.listing_occurrences.filter((o) => !o.cancelled);
    // No dated sessions at all: a program whose schedule is not confirmed.
    if (live.length === 0) {
      return [
        { ...base, sessionId: `${row.id}:unscheduled`, day: null, startTime: null, endTime: null },
      ];
    }
    return live.flatMap((o) => {
      const start = nyLocal(o.starts_at);
      if (start.day < today || start.day > lastDay) return [];
      return [
        {
          ...base,
          sessionId: o.id,
          day: start.day,
          startTime: start.time,
          endTime: o.ends_at ? nyLocal(o.ends_at).time : null,
        },
      ];
    });
  });
}
