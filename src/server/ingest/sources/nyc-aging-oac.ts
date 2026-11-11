import { nyInstant, nyToday } from "@/lib/dates";
import type { Borough } from "@/lib/listings/schema";

import { listingPayload, occurrence } from "../build";
import { fetchText, type FetchImpl } from "../http";
import { stringRow } from "../rows";
import { classifyDiscipline } from "../taxonomy";
import type { Source, SourceDef, SourceResult } from "../types";

// NYC Aging older adult center activities (NYC Open Data). Providers report
// their own activities, so only some centers appear. Today that is mostly tai chi.
export const OAC_DATASET = "https://data.cityofnewyork.us/resource/fzy4-e84j.json";
export const OAC_POLICY_URL = "https://www.nyc.gov/site/dfta/services/older-adult-center.page";
export const OAC_POLICY_QUOTE =
  "Older adult center membership is free and open to all New Yorkers, ages 60 and older.";

const DEF: SourceDef = {
  slug: "nyc-aging-oac",
  name: "NYC Aging older adult centers",
  url: "https://data.cityofnewyork.us/d/fzy4-e84j",
  method: "feed",
  cadence: "weekly",
};

interface OacRow {
  dfta_id?: string;
  providername?: string;
  eventname?: string;
  description?: string;
  eventlocation?: string;
  zipcode?: string;
  borough?: string;
  starttime?: string;
  endtime?: string;
  isvirtual?: string;
  latitude?: string;
  longitude?: string;
}

const BOROUGHS: Record<string, Borough> = {
  manhattan: "Manhattan",
  brooklyn: "Brooklyn",
  queens: "Queens",
  bronx: "Bronx",
  "staten island": "Staten Island",
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const parts = (floating: string | undefined) => {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(floating ?? "");
  return m ? { day: m[1]!, time: m[2]! } : null;
};

// Groups rows into one listing per center and activity name, with one session per row.
// Free membership does not prove that an individual activity is free.
export function parseOac(json: string, fetchedAt: string, today: string): SourceResult {
  const rows: unknown = JSON.parse(json);
  // Socrata answers an outage with a JSON object, not a list. That is a failed run, not "no rows".
  if (!Array.isArray(rows)) throw new Error("Unexpected response from NYC Open Data");
  const valid = rows.flatMap((row) => {
    const value = stringRow(row, [
      "dfta_id",
      "providername",
      "eventname",
      "description",
      "eventlocation",
      "zipcode",
      "borough",
      "starttime",
      "endtime",
      "isvirtual",
      "latitude",
      "longitude",
    ]);
    return value ? [value] : [];
  });
  const result = parseOacRows(valid, fetchedAt, today);
  return {
    ...result,
    fetched: rows.length,
    rejected: result.rejected + rows.length - valid.length,
  };
}

function parseOacRows(rows: OacRow[], fetchedAt: string, today: string): SourceResult {
  const groups = new Map<string, OacRow[]>();
  let rejected = 0;

  for (const row of rows) {
    const name = row.eventname?.trim();
    const discipline = name ? classifyDiscipline(name) : null;
    const start = parts(row.starttime);
    if (
      !row.dfta_id ||
      !name ||
      !discipline ||
      !start ||
      row.isvirtual === "Yes" ||
      start.day < today
    ) {
      rejected++;
      continue;
    }
    const key = `${row.dfta_id}:${slug(name)}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const candidates = [...groups.entries()].map(([key, group]) => {
    const first = group[0]!;
    const name = first.eventname!.trim();
    const cost = "unverified";
    const borough = BOROUGHS[(first.borough ?? "").trim().toLowerCase()] ?? null;
    const lat = Number(first.latitude);
    const lng = Number(first.longitude);
    return {
      listing: listingPayload({
        dedupe_key: `oac:${key}`,
        external_id: key,
        title: name,
        description: (first.description ?? "").trim(),
        discipline_slug: classifyDiscipline(name),
        category_slug: "class",
        ages_text: "Ages 60 and older",
        eligibility: "Older adult center members, ages 60 and older",
        venue: first.providername?.trim() ?? null,
        address:
          [first.eventlocation?.replace(/\s+/g, " ").trim(), first.zipcode]
            .filter(Boolean)
            .join(", ") || null,
        borough,
        latitude: Number.isFinite(lat) && lat !== 0 ? lat : null,
        longitude: Number.isFinite(lng) && lng !== 0 ? lng : null,
        source_url: DEF.url,
        registration_notes:
          "Membership is free for New Yorkers ages 60+. Confirm activity fees with the center.",
        cost_status: cost,
      }),
      occurrences: group.flatMap((row) => {
        const s = parts(row.starttime)!;
        const e = parts(row.endtime);
        const startsAt = nyInstant(s.day, s.time);
        if (!startsAt) return [];
        return [
          occurrence(startsAt, e ? nyInstant(e.day, e.time) : null, `${key}:${row.starttime}`),
        ];
      }),
      evidence: [],
    };
  });

  return { fetched: rows.length, rejected, candidates, fetchedAt };
}

// The whole dataset is about 1,500 rows, so read it all and filter here. A server-side
// LIKE filter was flaky (503) on Socrata and gains nothing at this size.
export function oacUrl(): string {
  return `${OAC_DATASET}?$limit=5000&$order=starttime`;
}

export function nycAgingOac(fetchImpl: FetchImpl = fetch): Source {
  return {
    def: DEF,
    collect: async () => {
      const fetchedAt = new Date().toISOString();
      const today = nyToday();
      const json = await fetchText(oacUrl(), { fetchImpl, accept: "application/json" });
      return parseOac(json, fetchedAt, today);
    },
  };
}
