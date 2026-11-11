import { nyInstant, nyToday } from "@/lib/dates";
import type { Borough } from "@/lib/listings/schema";

import { listingPayload, occurrence } from "../build";
import { fetchText, type FetchImpl } from "../http";
import { containsQuote, htmlToText } from "../quote";
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
// `policyVerified` says whether the NYC Aging page really carries the free quote today.
export function parseOac(
  json: string,
  fetchedAt: string,
  policyVerified: boolean,
  today: string,
): SourceResult {
  const rows = JSON.parse(json) as OacRow[];
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
    const cost = policyVerified ? "free_with_registration" : "unverified";
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
        registration_notes: policyVerified ? "Free with older adult center membership" : null,
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
      evidence: policyVerified
        ? [
            {
              quote: OAC_POLICY_QUOTE,
              url: OAC_POLICY_URL,
              captured_at: fetchedAt,
              method: "html" as const,
              supports_cost_status: cost,
            },
          ]
        : [],
    };
  });

  return { fetched: rows.length, rejected, candidates, fetchedAt };
}

const KEYWORDS = [
  "tai chi",
  "taichi",
  "qigong",
  "qi gong",
  "karate",
  "boxing",
  "kung fu",
  "self defense",
  "self-defense",
  "judo",
  "martial",
];

export function oacQueryUrl(today: string): string {
  const like = KEYWORDS.map((k) => `upper(eventname) like '%${k.toUpperCase()}%'`).join(" OR ");
  const where = `starttime >= '${today}T00:00:00' AND (${like})`;
  return `${OAC_DATASET}?$limit=1000&$where=${encodeURIComponent(where)}`;
}

export function nycAgingOac(fetchImpl: FetchImpl = fetch): Source {
  return {
    def: DEF,
    collect: async () => {
      const fetchedAt = new Date().toISOString();
      const today = nyToday();
      const json = await fetchText(oacQueryUrl(today), { fetchImpl, accept: "application/json" });
      // The free claim comes from a page, so prove the quote is still on it today.
      const policyVerified = await fetchText(OAC_POLICY_URL, { fetchImpl })
        .then((html) => containsQuote(htmlToText(html), OAC_POLICY_QUOTE))
        .catch(() => false);
      return parseOac(json, fetchedAt, policyVerified, today);
    },
  };
}
