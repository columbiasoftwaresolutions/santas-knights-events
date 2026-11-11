import { addDays, nyInstant, nyToday, parseClock } from "@/lib/dates";
import { BOROUGHS, type Borough } from "@/lib/listings/schema";

import { htmlToText } from "../quote";
import { classifyDiscipline } from "../taxonomy";
import type { Candidate, Source, SourceResult } from "../types";

const ORIGIN = "https://www.nycgovparks.org";
const INDEX = `${ORIGIN}/facilities/recreationcenters`;
export const PARKS_USER_AGENT =
  "Mozilla/5.0 (compatible; SantasKnightsEvents/0.1; public recreation schedule reader)";

// A small, balanced HTML reader for the server-rendered Parks markup. In
// particular, program divs contain nested account-help divs: a regex ending at
// the first </div> would truncate them. No scripts or attributes are executed.
interface Element {
  tag: string;
  attrs: Record<string, string>;
  children: (Element | string)[];
}

function readHtml(html: string): Element {
  const root: Element = { tag: "root", attrs: {}, children: [] };
  const stack = [root];
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<[^>]*>|[^<]+/g)) {
    const raw = token[0];
    if (raw.startsWith("<!")) continue;
    const closing = /^<\/([\w-]+)/.exec(raw);
    if (closing) {
      const index = stack.findLastIndex((node) => node.tag === closing[1]!.toLowerCase());
      if (index > 0) stack.length = index;
      continue;
    }
    const opening = /^<([\w-]+)/.exec(raw);
    if (!opening) {
      stack.at(-1)!.children.push(raw);
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const attr of raw
      .slice(opening[0].length)
      .matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[attr[1]!.toLowerCase()] = htmlToText(attr[2] ?? attr[3] ?? attr[4] ?? "");
    }
    const node: Element = { tag: opening[1]!.toLowerCase(), attrs, children: [] };
    stack.at(-1)!.children.push(node);
    if (
      !/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(node.tag) &&
      !raw.endsWith("/>")
    ) {
      stack.push(node);
    }
  }
  return root;
}

function descendants(node: Element, tag: string): Element[] {
  return node.children.flatMap((child) =>
    typeof child === "string"
      ? []
      : [...(child.tag === tag ? [child] : []), ...descendants(child, tag)],
  );
}

function text(node: Element): string {
  return node.children
    .map((child) => (typeof child === "string" ? htmlToText(child) : text(child)))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasClass(node: Element, name: string): boolean {
  return (node.attrs.class ?? "").split(/\s+/).includes(name);
}

function httpUrl(value: string | undefined): string | null {
  if (!value || !/^https?:\/\//i.test(value)) return null;
  try {
    return new URL(value).href;
  } catch {
    return null;
  }
}

export function parseCenterIndex(html: string): { centerCode: string; centerName: string }[] {
  const centers = new Map<string, string>();
  for (const a of descendants(readHtml(html), "a")) {
    let url: URL;
    try {
      url = new URL(a.attrs.href ?? "", ORIGIN);
    } catch {
      continue;
    }
    const code = /^\/facilities\/recreationcenters\/([\w-]+)\/?$/.exec(url.pathname)?.[1];
    const name = text(a).replace(/\s+Details(?: and Schedule)?$/i, "");
    if (url.origin === ORIGIN && code && name && !/^Details$/i.test(name)) {
      centers.set(code, name);
    }
  }
  return [...centers].map(([centerCode, centerName]) => ({ centerCode, centerName }));
}

// The title decides. A description that merely mentions tai chi ("Seated Movements:
// yoga, tai chi and chair exercise") is not a tai chi class.
export function isMartialArts(title: string): boolean {
  return classifyDiscipline(title) !== null;
}

// Parks center codes start with the borough letter, as park ids do (M058, B126, Q099, X..., R...).
const BOROUGH_BY_CODE_PREFIX: Record<string, Borough> = {
  M: "Manhattan",
  B: "Brooklyn",
  Q: "Queens",
  X: "Bronx",
  R: "Staten Island",
};
export const boroughFromCenterCode = (code: string): Borough | null =>
  BOROUGH_BY_CODE_PREFIX[code.charAt(0).toUpperCase()] ?? null;

// Select the closest valid M/D to the New York fetch date, not simply its year.
// That covers a week straddling New Year in either direction.
function headerDate(label: string, fetchedAt: string): string | null {
  const match =
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2})\/(\d{1,2})\b/i.exec(
      label,
    );
  if (!match) return null;
  const today = nyToday(new Date(fetchedAt));
  const year = Number(today.slice(0, 4));
  const dates = [year - 1, year, year + 1]
    .map((y) => `${y}-${match[2]!.padStart(2, "0")}-${match[3]!.padStart(2, "0")}`)
    .filter((day) => {
      const date = new Date(`${day}T12:00:00Z`);
      return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(day);
    })
    .sort(
      (a, b) =>
        Math.abs(Date.parse(a) - Date.parse(today)) - Math.abs(Date.parse(b) - Date.parse(today)),
    );
  const day = dates[0];
  // A stale or changed page must not invent sessions in a distant week.
  return day && day >= addDays(today, -6) && day <= addDays(today, 6) ? day : null;
}

export interface ScheduleContext {
  centerCode: string;
  centerName: string;
  fetchedAt: string;
}

export function parseSchedulePage(
  html: string,
  context: ScheduleContext,
): Omit<SourceResult, "candidates"> & { candidates: Candidate[] } {
  const root = readHtml(html);
  const pageTitle = descendants(root, "title")[0];
  const heading = descendants(root, "h1")[0];
  const venue =
    (pageTitle ? text(pageTitle).replace(/\s+Schedule\s*:.*$/i, "") : "") ||
    (heading ? text(heading).replace(/\s+Schedule$/i, "") : "") ||
    context.centerName;
  const programs = new Map<string, Element>();
  for (const node of descendants(root, "div")) {
    const id = /^program_(\d+)$/.exec(node.attrs.id ?? "")?.[1];
    if (id) programs.set(id, node);
  }
  const cells = new Map<string, { day: string | null; label: string; clock: string }[]>();
  for (const table of descendants(root, "table")) {
    let headers: { day: string | null; label: string }[] = [];
    for (const row of descendants(table, "tr")) {
      const columns = row.children.filter(
        (c): c is Element => typeof c !== "string" && /^(th|td)$/.test(c.tag),
      );
      if (columns.some((c) => c.tag === "th")) {
        headers = columns.map((c) => ({
          day: headerDate(text(c), context.fetchedAt),
          label: text(c),
        }));
        continue;
      }
      columns.forEach((column, index) => {
        for (const p of descendants(column, "p").filter((node) => hasClass(node, "program"))) {
          const id = descendants(p, "a")
            .map((a) => /^#program_(\d+)$/.exec(a.attrs.href ?? "")?.[1])
            .find(Boolean);
          if (!id) continue;
          const breakIndex = p.children.findIndex(
            (child) => typeof child !== "string" && child.tag === "br",
          );
          const clock = p.children.slice(0, breakIndex < 0 ? undefined : breakIndex);
          const clockText = text({ tag: "clock", attrs: {}, children: clock });
          const header = headers[index];
          const existing = cells.get(id) ?? [];
          existing.push({ day: header?.day ?? null, label: header?.label ?? "", clock: clockText });
          cells.set(id, existing);
        }
      });
    }
  }

  const candidates: Candidate[] = [];
  let rejected = 0;
  for (const [id, program] of programs) {
    const titleNode = descendants(program, "h3")[0];
    const title = titleNode ? text(titleNode) : "";
    const paragraphs = program.children.filter(
      (c): c is Element => typeof c !== "string" && c.tag === "p",
    );
    // Direct unlabelled paragraphs are room, then description. Account-help
    // paragraphs inside nested divs must never enter the description/filter.
    const prose = paragraphs.filter(
      (p) => !p.attrs.class && !/^(Instructor|Intensity|Ages):/i.test(text(p)),
    );
    const description = prose.slice(1).map(text).join("\n");
    const discipline = classifyDiscipline(title);
    if (!title || !discipline) {
      rejected++;
      continue;
    }
    const occurrences: Candidate["occurrences"][number][] = [];
    const schedule: string[] = [];
    const seen = new Set<string>();
    for (const cell of cells.get(id) ?? []) {
      const times = cell.clock.split(/\s*[-–—]\s*/);
      const start = parseClock(times[0] ?? "");
      const end = times.length === 2 ? parseClock(times[1]!) : null;
      const startsAt = cell.day && start ? nyInstant(cell.day, start) : null;
      const endsAt = cell.day && end ? nyInstant(cell.day, end) : null;
      if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) {
        rejected++;
        continue;
      }
      const key = `${id}:${cell.day}:${start}`;
      if (seen.has(key)) continue;
      seen.add(key);
      occurrences.push({
        starts_at: startsAt,
        ends_at: endsAt,
        source_occurrence_key: key,
        cancelled: false,
      });
      schedule.push(`${cell.label} ${cell.clock}`);
    }
    if (!occurrences.length) {
      if (!cells.get(id)?.length) rejected++;
      continue;
    }
    const ages = paragraphs.map(text).find((p) => /^Ages:/i.test(p));
    const registration = paragraphs.find((p) => hasClass(p, "registration-link-description"));
    const registrationLink = paragraphs.find((p) => hasClass(p, "registration-link"));
    const registrationUrl = registrationLink
      ? (descendants(registrationLink, "a")
          .map((a) => httpUrl(a.attrs.href))
          .find((url) => url !== null) ?? null)
      : null;
    candidates.push({
      listing: {
        dedupe_key: `parks-rec:${context.centerCode}:${id}`,
        external_id: id,
        title,
        description,
        category_slug: "class",
        discipline_slug: discipline,
        ages_text: ages?.replace(/^Ages:\s*/i, "") || null,
        eligibility: null,
        venue,
        address: null,
        borough: boroughFromCenterCode(context.centerCode),
        neighborhood: null,
        latitude: null,
        longitude: null,
        schedule_text: schedule.join("; "),
        cost_status: "unverified",
        registration_url: registrationUrl,
        registration_notes: registration ? text(registration) : null,
        source_url: `${INDEX}/${context.centerCode}/schedule`,
        status: "active",
      },
      occurrences,
      evidence: [],
    });
  }
  // Bad grid cells count as rejected too, including a bad cell on an otherwise
  // usable program. Never interpret the current week's omissions as cancellations.
  return { fetched: programs.size, rejected, candidates, fetchedAt: context.fetchedAt };
}

export function parseCenterDetails(
  html: string,
): Pick<Candidate["listing"], "address" | "borough" | "neighborhood" | "latitude" | "longitude"> {
  const root = readHtml(html);
  // Verified Parks address layout: h1, then .row > .span5 > div, with
  // street/city lines before the Cross Streets label. Do not geocode or infer borough.
  const column = descendants(root, "div").find((node) => hasClass(node, "span5"));
  const container = column?.children.find(
    (c): c is Element => typeof c !== "string" && c.tag === "div",
  );
  const labelIndex =
    container?.children.findIndex((c) => typeof c !== "string" && c.tag === "strong") ?? -1;
  const prefix = container?.children.slice(0, labelIndex < 0 ? undefined : labelIndex);
  const address = prefix ? text({ tag: "address", attrs: {}, children: prefix }) : "";
  const labelled = descendants(root, "p").map(text);
  const borough = labelled.find((line) => /^Borough:\s*/i.test(line))?.replace(/^Borough:\s*/i, "");
  const neighborhood =
    labelled.find((line) => /^Neighborhood:\s*/i.test(line))?.replace(/^Neighborhood:\s*/i, "") ||
    null;
  return {
    address: /^\d/.test(address) && /\bNY\s+\d{5}\b/.test(address) ? address : null,
    borough: BOROUGHS.includes(borough as Borough) ? (borough as Borough) : null,
    neighborhood,
    latitude: null,
    longitude: null,
  };
}

export const parksRecCenters = {
  def: {
    slug: "parks-rec-centers",
    name: "NYC Parks recreation-center schedules",
    url: INDEX,
    method: "html",
    cadence: "weekly",
  },
  async collect(fetchImpl: typeof fetch = fetch): Promise<SourceResult> {
    const fetchedAt = new Date().toISOString();
    const result: SourceResult = { fetched: 0, rejected: 0, candidates: [], fetchedAt };
    const candidates: Candidate[] = [];
    result.candidates = candidates;
    const deadline = Date.now() + 240_000;
    let requested = false;
    let stopped = false;
    async function get(url: string): Promise<string | null> {
      if (stopped) return null;
      if (requested) await new Promise((resolve) => setTimeout(resolve, 3000));
      if (Date.now() >= deadline) {
        stopped = true;
        result.incomplete = true;
        return null;
      }
      requested = true;
      try {
        const response = await fetchImpl(url, {
          headers: { "User-Agent": PARKS_USER_AGENT, Accept: "text/html,application/xhtml+xml" },
          signal: AbortSignal.timeout(Math.min(20_000, deadline - Date.now())),
          cache: "no-store",
          redirect: "manual",
        });
        if (!response.ok) {
          result.incomplete = true;
          if (response.status === 403 || response.status === 429) stopped = true;
          return null;
        }
        return await response.text();
      } catch {
        // Timeout/network failure: preserve anything already collected; no retry.
        stopped = true;
        result.incomplete = true;
        return null;
      }
    }
    const index = await get(INDEX);
    // No index at all is a failed run, not an empty source.
    if (!index) throw new Error("NYC Parks recreation center index could not be read");
    for (const center of parseCenterIndex(index)) {
      // Parks requests must remain sequential, including the delay inside get.
      // eslint-disable-next-line no-await-in-loop
      const html = await get(`${INDEX}/${center.centerCode}/schedule`);
      if (stopped) break;
      if (!html) continue;
      const page = parseSchedulePage(html, { ...center, fetchedAt });
      result.fetched += page.fetched;
      result.rejected += page.rejected;
      // Add candidates before enrichment so a block on the extra GET loses no data.
      candidates.push(...page.candidates);
      if (page.candidates.length) {
        // eslint-disable-next-line no-await-in-loop -- preserve the same host-wide request spacing
        const detail = await get(`${INDEX}/${center.centerCode}`);
        if (detail) {
          const location = parseCenterDetails(detail);
          for (const candidate of page.candidates) {
            Object.assign(candidate.listing, {
              ...location,
              borough: location.borough ?? candidate.listing.borough,
            });
          }
        }
      }
      if (stopped) break;
    }
    return result;
  },
} satisfies Source;
