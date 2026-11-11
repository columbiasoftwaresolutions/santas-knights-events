import { nyInstant } from "@/lib/dates";
import { normalizeSourceUrl } from "@/lib/listings/url";

import { listingPayload, occurrence } from "../build";
import { fetchText, type FetchImpl } from "../http";
import { classifyDiscipline } from "../taxonomy";
import type { Source, SourceDef, SourceResult } from "../types";

// NYC Parks public events (next 14 days), read through the NYC Open Data copy.
// Parks' own /xml/ feed carries the same rows but its robots.txt disallows /xml/.
export const PARKS_EVENTS_URL = "https://data.cityofnewyork.us/resource/w3wp-dpdi.json?$limit=2000";

const DEF: SourceDef = {
  slug: "parks-events",
  name: "NYC Parks events",
  url: "https://data.cityofnewyork.us/d/w3wp-dpdi",
  method: "feed",
  cadence: "daily",
};

interface ParksRow {
  title?: string;
  guid?: string;
  description?: string;
  link?: { url?: string } | string;
  registration_url?: { url?: string } | string;
  registration_description?: string;
  parkids?: string;
  parknames?: string;
  location?: string;
  starttime?: string;
  endtime?: string;
  coordinates?: string;
}

const BOROUGH_BY_PARK_PREFIX = {
  M: "Manhattan",
  B: "Brooklyn",
  Q: "Queens",
  X: "Bronx",
  R: "Staten Island",
} as const;

const urlOf = (v: ParksRow["link"]) => (typeof v === "string" ? v : v?.url) ?? null;

// A sentence of the description that says the event is free. Parks writes "Free!" or
// "This class is free" in some descriptions. Null means no explicit cost sentence.
export function freeSentence(description: string): string | null {
  const sentences = description.replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) ?? [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (
      /\b(free|no cost|no charge|no fee)\b/i.test(s) &&
      !/\b(not free|fee required|\$\d)/i.test(s)
    ) {
      return s;
    }
  }
  return null;
}

function localParts(floating: string | undefined) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(floating ?? "");
  return m ? { day: m[1]!, time: m[2]! } : null;
}

export function parksEventToCandidate(row: ParksRow, fetchedAt: string): unknown | null {
  const title = row.title?.trim();
  const guid = row.guid?.trim();
  // The title decides relevance. A description that merely mentions kickboxing
  // ("dance meets kickboxing meets yoga") is not a martial arts class.
  const discipline = title ? classifyDiscipline(title) : null;
  const sourceUrl = normalizeSourceUrl(urlOf(row.link) ?? "");
  const start = localParts(row.starttime);
  const startsAt = start ? nyInstant(start.day, start.time) : null;
  if (!title || !guid || !discipline || !sourceUrl || !start || !startsAt) return null;

  const end = localParts(row.endtime);
  const endsAt = end ? nyInstant(end.day, end.time) : null;
  const registrationUrl = normalizeSourceUrl(urlOf(row.registration_url) ?? "");
  const description = (row.description ?? "").trim();
  const quote = freeSentence(description);
  const [lat, lng] = (row.coordinates ?? "").split(",").map((n) => Number(n.trim()));
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
  const prefix = (row.parkids ?? "")
    .trim()
    .charAt(0)
    .toUpperCase() as keyof typeof BOROUGH_BY_PARK_PREFIX;

  const cost = quote ? (registrationUrl ? "free_with_registration" : "free") : "unverified";
  return {
    listing: listingPayload({
      dedupe_key: `parks-event:${guid}`,
      external_id: guid,
      title,
      description,
      discipline_slug: discipline,
      venue: [row.location, row.parknames].filter(Boolean).join(", ") || null,
      borough: BOROUGH_BY_PARK_PREFIX[prefix] ?? null,
      latitude: hasPoint ? lat! : null,
      longitude: hasPoint ? lng! : null,
      source_url: sourceUrl,
      registration_url: registrationUrl,
      registration_notes: row.registration_description?.trim() || null,
      cost_status: cost,
    }),
    occurrences: [occurrence(startsAt, endsAt, `${guid}:${row.starttime}`)],
    evidence: quote
      ? [
          {
            quote,
            url: sourceUrl,
            captured_at: fetchedAt,
            method: "feed",
            supports_cost_status: cost,
          },
        ]
      : [],
  };
}

export function parseParksEvents(json: string, fetchedAt: string): SourceResult {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error("Unexpected response from NYC Open Data");
  const rows = parsed as ParksRow[];
  const candidates = rows.flatMap((row) => {
    const c = parksEventToCandidate(row, fetchedAt);
    return c ? [c] : [];
  });
  return { fetched: rows.length, rejected: rows.length - candidates.length, candidates, fetchedAt };
}

export function parksEvents(fetchImpl: FetchImpl = fetch): Source {
  return {
    def: DEF,
    collect: async () => {
      const fetchedAt = new Date().toISOString();
      const body = await fetchText(PARKS_EVENTS_URL, { fetchImpl, accept: "application/json" });
      return parseParksEvents(body, fetchedAt);
    },
  };
}
