import { readFileSync } from "node:fs";

import { Schema } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Candidate } from "../types";
import {
  boroughFromCenterCode,
  isMartialArts,
  parksRecCenters,
  parseCenterDetails,
  parseCenterIndex,
  parseSchedulePage,
} from "./parks-rec-centers";

// Fixtures are trimmed excerpts of real pages, fetched 2026-11-11.
const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/parks-rec-centers/${name}.html`, import.meta.url), "utf8");

const fetchedAt = "2026-11-11T17:00:00.000Z";
const context = { centerCode: "M058", centerName: "Pelham Fritz Recreation Center", fetchedAt };
const indexUrl = "https://www.nycgovparks.org/facilities/recreationcenters";

// A minimal schedule page: one karate program, one grid cell per header.
function page(headers: string[], times: string[]) {
  return `<table><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    <tr>${times.map((t) => `<td><p class="program">${t}<br/><a href="#program_42">Karate</a></p></td>`).join("")}</tr></table>
    <div id="program_42"><h3>Karate</h3><p>Gym</p><p>Practice karate safely.</p><p>Ages: Everyone</p>
    <p class="registration-link-description">Registration not required.</p></div>`;
}

afterEach(() => vi.useRealTimers());

describe("what counts as a martial arts class", () => {
  it("goes by the title, with word boundaries", () => {
    expect(isMartialArts("Tai Chi")).toBe(true);
    expect(isMartialArts("MMA fundamentals")).toBe(true);
    expect(isMartialArts("Filmmaking")).toBe(false);
    // A description that mentions tai chi does not make "Seated Movements" a tai chi class.
    expect(isMartialArts("Seated Movements")).toBe(false);
  });

  it("derives the borough from the center code, and leaves an unknown code unknown", () => {
    expect(boroughFromCenterCode("M058")).toBe("Manhattan");
    expect(boroughFromCenterCode("Q099-NMD01")).toBe("Queens");
    expect(boroughFromCenterCode("Z999")).toBeNull();
  });
});

describe("reading a schedule page", () => {
  it("lists distinct centers and ignores links that are not centers", () => {
    const centers = parseCenterIndex(
      fixture("index") +
        `<a href="/facilities/recreationcenters/M058">Details</a>
         <a href="https://other.example/facilities/recreationcenters/X999">Other</a>`,
    );
    const codes = centers.map((c) => c.centerCode);
    expect(codes).toContain("M058");
    expect(codes).not.toContain("X999");
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("turns a real page into unverified martial arts candidates with dated sessions", () => {
    const result = parseSchedulePage(fixture("M058-schedule"), context);
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.rejected).toBeGreaterThan(0); // the non-martial-arts programs

    const first = Schema.decodeUnknownSync(Candidate)(result.candidates[0]);
    expect(first.listing.dedupe_key).toMatch(/^parks-rec:M058:\d+$/);
    expect(first.listing.borough).toBe("Manhattan");
    expect(first.occurrences[0]!.starts_at).toBe("2026-11-10T18:00:00-05:00");
  });

  it("never claims a class is free: Parks says martial arts may carry session fees", () => {
    for (const name of ["M058-schedule", "M014-schedule"]) {
      for (const raw of parseSchedulePage(fixture(name), context).candidates) {
        const c = Schema.decodeUnknownSync(Candidate)(raw);
        expect(c.listing.cost_status).toBe("unverified");
        expect(c.evidence).toEqual([]);
      }
    }
  });

  it("gives each program one listing with a session per grid cell", () => {
    const result = parseSchedulePage(
      page(["Monday<br/>11/9", "Tuesday<br/>11/10"], ["12:00 p - 1:00 p", "9:30 a - 10:30 a"]),
      context,
    );
    expect(result.candidates).toHaveLength(1);
    const starts = Schema.decodeUnknownSync(Candidate)(result.candidates[0]).occurrences.map(
      (o) => o.starts_at,
    );
    expect(starts).toEqual(["2026-11-09T12:00:00-05:00", "2026-11-10T09:30:00-05:00"]);
  });

  it("picks the right year across New Year", () => {
    const html = page(
      ["Thursday<br/>12/31", "Friday<br/>1/1"],
      ["12:00 p - 1:00 p", "9:30 a - 10:30 a"],
    );
    for (const now of ["2026-12-31T17:00:00Z", "2027-01-01T17:00:00Z"]) {
      const keys = Schema.decodeUnknownSync(Candidate)(
        parseSchedulePage(html, { ...context, fetchedAt: now }).candidates[0],
      ).occurrences.map((o) => o.starts_at.slice(0, 10));
      expect(keys).toEqual(["2026-12-31", "2027-01-01"]);
    }
  });

  it("drops a cell with an impossible time, counts it, and keeps the valid cell", () => {
    const result = parseSchedulePage(
      page(["Monday<br/>11/9", "Tuesday<br/>11/10"], ["25:00 p - 1:00 p", "12:00 a - 1:00 a"]),
      context,
    );
    expect(result.rejected).toBe(1);
    expect(Schema.decodeUnknownSync(Candidate)(result.candidates[0]).occurrences).toHaveLength(1);
  });

  it("does not keep a registration link that is not plain http(s)", () => {
    const html = page(["Monday<br/>11/9"], ["12:00 p - 1:00 p"]).replace(
      "</div>",
      '<p class="registration-link"><a href="javascript:alert(1)">Register</a></p></div>',
    );
    expect(parseSchedulePage(html, context).candidates[0]).toMatchObject({
      listing: { registration_url: null },
    });
  });

  it("reads the center's address, and leaves it unknown when the page has none", () => {
    expect(parseCenterDetails(fixture("M058-center")).address).toMatch(/Mount Morris Park West/);
    expect(parseCenterDetails("<h1>A center</h1>").address).toBeNull();
  });
});

describe("collecting politely", () => {
  function setup(respond: (url: string) => Response) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(fetchedAt));
    const calls: { url: string; at: number }[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      calls.push({ url: String(input), at: Date.now() });
      return respond(String(input));
    };
    return { calls, fetchImpl };
  }
  const serve = (url: string) => {
    if (url === indexUrl) return new Response(fixture("index"));
    if (url.endsWith("/schedule")) return new Response(fixture("M058-schedule"));
    return new Response(fixture("M058-center"));
  };

  it("waits at least three seconds between requests", async () => {
    const { fetchImpl, calls } = setup(serve);
    const pending = parksRecCenters.collect(fetchImpl);
    await vi.runAllTimersAsync();
    await pending;
    expect(calls.length).toBeGreaterThan(2);
    for (let i = 1; i < calls.length; i++) {
      expect(calls[i]!.at - calls[i - 1]!.at).toBeGreaterThanOrEqual(3000);
    }
  });

  it.each([403, 429])("stops at once on %s and keeps what it already has", async (status) => {
    const { fetchImpl, calls } = setup((url) =>
      url.endsWith("/schedule") || url === indexUrl ? serve(url) : new Response("no", { status }),
    );
    const pending = parksRecCenters.collect(fetchImpl);
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(result.candidates.length).toBeGreaterThan(0);
    // It never moved on to another center after being refused.
    expect(calls.filter((c) => c.url.endsWith("/schedule"))).toHaveLength(1);
  });

  it("fails the run when the center index cannot be read", async () => {
    const { fetchImpl } = setup(() => new Response("no", { status: 403 }));
    await expect(parksRecCenters.collect(fetchImpl)).rejects.toThrow();
  });
});
