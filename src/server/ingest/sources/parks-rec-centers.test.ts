import { readFileSync } from "node:fs";

import { Schema } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Candidate } from "../types";
import {
  boroughFromCenterCode,
  isMartialArts,
  PARKS_USER_AGENT,
  parksRecCenters,
  parseCenterDetails,
  parseCenterIndex,
  parseSchedulePage,
} from "./parks-rec-centers";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/parks-rec-centers/${name}.html`, import.meta.url), "utf8");
const fetchedAt = "2026-11-11T17:00:00.000Z";
const context = { centerCode: "M058", centerName: "Pelham Fritz Recreation Center", fetchedAt };
const indexUrl = "https://www.nycgovparks.org/facilities/recreationcenters";

function checkCandidates(candidates: readonly unknown[]) {
  expect(candidates.length).toBeGreaterThan(0);
  for (const raw of candidates) {
    const candidate = Schema.decodeUnknownSync(Candidate)(raw);
    expect(candidate.listing.cost_status).toBe("unverified");
    expect(candidate.evidence).toEqual([]);
    expect(candidate.occurrences.every((o) => !o.cancelled)).toBe(true);
  }
}

function sample(
  headers = ["Monday<br/>11/9", "Tuesday<br/>11/10"],
  times = ["12:00 p - 1:00 p", "9:30 a - 10:30 a"],
) {
  return `<table><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    <tr>${times.map((t) => `<td><p class="program">${t}<br/><a href="#program_42">Karate</a></p></td>`).join("")}</tr></table>
    <div id="program_42"><h3>Karate</h3><p>Gym</p><p>Practice karate safely.</p><p>Ages: Everyone</p>
    <p class="registration-link-description">Registration not required.</p>
    <div><p>Account help: boxing classes may require fees.</p></div></div>`;
}

afterEach(() => vi.useRealTimers());

describe("borough from the center code", () => {
  it("maps the leading letter and leaves anything else unknown", () => {
    expect(boroughFromCenterCode("M058")).toBe("Manhattan");
    expect(boroughFromCenterCode("B126")).toBe("Brooklyn");
    expect(boroughFromCenterCode("Q099-NMD01")).toBe("Queens");
    expect(boroughFromCenterCode("X012")).toBe("Bronx");
    expect(boroughFromCenterCode("R001")).toBe("Staten Island");
    expect(boroughFromCenterCode("Z999")).toBeNull();
  });
});

describe("Parks recreation-center HTML", () => {
  it("reads distinct centers, ignores detail-only, foreign and non-center links", () => {
    expect(
      parseCenterIndex(
        fixture("index") +
          `
      <a href="/facilities/recreationcenters/M058">Details</a>
      <a href="/facilities/recreationcenters/M058/schedule">Schedule</a>
      <a href="https://other.example/facilities/recreationcenters/X999">Other</a>
      <a href="/facilities/recreationcenters/Q099-NMD01">Al Oerter Details and Schedule</a>`,
      ),
    ).toEqual([
      { centerCode: "M058", centerName: "Pelham Fritz Recreation Center" },
      { centerCode: "M014", centerName: "Jackie Robinson Recreation Center" },
      { centerCode: "Q099-NMD01", centerName: "Al Oerter" },
    ]);
  });

  it("maps live karate blocks, dates and registration without claiming free access", () => {
    const result = parseSchedulePage(fixture("M058-schedule"), context);
    expect(result).toMatchObject({ fetched: 3, rejected: 1, fetchedAt });
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]).toMatchObject({
      listing: {
        dedupe_key: "parks-rec:M058:2292142",
        external_id: "2292142",
        title: "Karate",
        description: "Karate",
        category_slug: "class",
        discipline_slug: "karate",
        ages_text: "Everyone",
        venue: context.centerName,
        address: null,
        // M058 starts with M: Manhattan. The center page itself shows no borough.
        borough: "Manhattan",
        neighborhood: null,
        latitude: null,
        longitude: null,
        schedule_text: "Tuesday 11/10 6:00 p - 7:30 p",
        registration_notes: "Registration has begun and ends on 12/16/2026.",
        source_url: `${indexUrl}/M058/schedule`,
        status: "active",
      },
      occurrences: [
        {
          starts_at: "2026-11-10T18:00:00-05:00",
          ends_at: "2026-11-10T19:30:00-05:00",
          source_occurrence_key: "2292142:2026-11-10:18:00",
          cancelled: false,
        },
      ],
    });
    expect(result.candidates[0]!.listing.registration_url).toContain("&embed=False&");
    expect(result.candidates[1]!.occurrences[0]!.starts_at).toBe("2026-11-12T18:00:00-05:00");
    checkCandidates(result.candidates);
  });

  it("reads live boxing descriptions, age groups and registration sentences", () => {
    const result = parseSchedulePage(fixture("M014-schedule"), { ...context, centerCode: "M014" });
    expect(result).toMatchObject({ fetched: 3, rejected: 1 });
    expect(result.candidates.map((c) => c.listing.title)).toEqual([
      "Adult Boxing Fitness",
      "Youth Boxing fitness",
    ]);
    expect(result.candidates[1]!.listing.ages_text).toBe("Child, Teen");
    expect(result.candidates[0]!.listing.venue).toBe("Jackie Robinson Recreation Center");
    expect(result.candidates[0]!.listing.description).toContain("fundamentals meet footwork");
    expect(
      result.candidates.every(
        (c) =>
          c.listing.registration_url === null &&
          c.listing.registration_notes === "Registration not required.",
      ),
    ).toBe(true);
    checkCandidates(result.candidates);
  });

  it("groups multiple grid cells per program and deduplicates repeated cells", () => {
    const result = parseSchedulePage(sample() + sample(), context);
    expect(result).toMatchObject({ fetched: 1, rejected: 0 });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]!.occurrences).toHaveLength(2);
    expect(result.candidates[0]!.occurrences.map((o) => o.starts_at)).toEqual([
      "2026-11-09T12:00:00-05:00",
      "2026-11-10T09:30:00-05:00",
    ]);
    expect(result.candidates[0]!.listing.description).toBe("Practice karate safely.");
    checkCandidates(result.candidates);
  });

  it.each(["2026-12-31T17:00:00Z", "2027-01-01T17:00:00Z"])(
    "infers both years across New Year when fetched %s",
    (now) => {
      const result = parseSchedulePage(sample(["Thursday<br/>12/31", "Friday<br/>1/1"]), {
        ...context,
        fetchedAt: now,
      });
      expect(result.candidates[0]!.occurrences.map((o) => o.source_occurrence_key)).toEqual([
        "42:2026-12-31:12:00",
        "42:2027-01-01:09:30",
      ]);
      checkCandidates(result.candidates);
    },
  );

  it("uses New York daylight saving offsets", () => {
    const result = parseSchedulePage(sample(["Monday<br/>7/6", "Tuesday<br/>7/7"]), {
      ...context,
      fetchedAt: "2026-07-08T17:00:00Z",
    });
    expect(result.candidates[0]!.occurrences[0]!.starts_at).toBe("2026-07-06T12:00:00-04:00");
    checkCandidates(result.candidates);
  });

  it.each([
    "25:00 p - 1:00 p",
    "12:75 p - 1:00 p",
    "noon - 1:00 p",
    "2:00 p - 1:00 p",
    "12:00 p",
    "12:00 p - 13:00 p",
  ])("rejects and counts a bad cell (%s), retaining valid cells", (badTime) => {
    const result = parseSchedulePage(sample(undefined, [badTime, "12:00 a - 1:00 a"]), context);
    expect(result.rejected).toBe(1);
    expect(result.candidates[0]!.occurrences).toHaveLength(1);
    expect(result.candidates[0]!.occurrences[0]!.starts_at).toBe("2026-11-10T00:00:00-05:00");
    checkCandidates(result.candidates);
  });

  it("rejects programs with no usable cells or with stale/invalid date headers", () => {
    for (const html of [
      sample(["Monday<br/>2/31", "Tuesday<br/>1/10"]),
      sample().replace(/class="program"/g, 'class="other"'),
    ]) {
      const result = parseSchedulePage(html, context);
      expect(result.fetched).toBe(1);
      expect(result.rejected).toBeGreaterThan(0);
      expect(result.candidates).toEqual([]);
    }
  });

  it("uses word boundaries, rejecting Filmmaking while recognizing MMA as a standalone word", () => {
    expect(isMartialArts("Filmmaking")).toBe(false);
    expect(isMartialArts("Swimming")).toBe(false);
    expect(isMartialArts("MMA fundamentals")).toBe(true);
    // The title decides: a description that mentions tai chi does not make a class tai chi.
    expect(isMartialArts("Seated Movements")).toBe(false);
    expect(isMartialArts("Tai Chi")).toBe(true);
    const result = parseSchedulePage(
      sample().replaceAll("Karate", "Filmmaking").replaceAll("karate", "filmmaking"),
      context,
    );
    expect(result).toMatchObject({ fetched: 1, rejected: 1, candidates: [] });
  });

  it("keeps non-http registration links out of candidates", () => {
    const html = sample().replace(
      "<div><p>Account help:",
      '<p class="registration-link"><a href="javascript:alert(1)">Register</a></p><div><p>Account help:',
    );
    const result = parseSchedulePage(html, context);
    expect(result.candidates[0]!.listing.registration_url).toBeNull();
    checkCandidates(result.candidates);
  });

  it("extracts the live address and leaves unobserved location data unknown", () => {
    expect(parseCenterDetails(fixture("M058-center"))).toEqual({
      address: "18 Mount Morris Park West New York, NY 10027",
      borough: null,
      neighborhood: null,
      latitude: null,
      longitude: null,
    });
    expect(parseCenterDetails("<h1>Pelham Fritz Recreation Center</h1>").address).toBeNull();
  });
});

describe("Parks collector (offline injected fetch)", () => {
  function setup(respond: (url: string) => Response | Promise<Response>) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(fetchedAt));
    const calls: { url: string; at: number; init: RequestInit | undefined }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push({ url, at: Date.now(), init });
      return await respond(url);
    };
    return { calls, fetchImpl };
  }

  it("collects sequentially with spacing, timeout, headers and enrichment", async () => {
    const { fetchImpl, calls } = setup((url) => {
      if (url === indexUrl) return new Response(fixture("index"));
      if (url.endsWith("/M058/schedule")) return new Response(fixture("M058-schedule"));
      if (url.endsWith("/M014/schedule")) return new Response(fixture("M014-schedule"));
      if (url.endsWith("/M058")) return new Response(fixture("M058-center"));
      return new Response("<h1>Jackie Robinson Recreation Center</h1>");
    });
    const pending = parksRecCenters.collect(fetchImpl);
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(parksRecCenters.def).toMatchObject({
      slug: "parks-rec-centers",
      method: "html",
      cadence: "weekly",
    });
    expect(result).toMatchObject({ fetched: 6, rejected: 2, fetchedAt });
    expect(result.candidates).toHaveLength(4);
    expect(calls.map((c) => c.url)).toEqual([
      indexUrl,
      `${indexUrl}/M058/schedule`,
      `${indexUrl}/M058`,
      `${indexUrl}/M014/schedule`,
      `${indexUrl}/M014`,
    ]);
    for (let i = 1; i < calls.length; i++)
      expect(calls[i]!.at - calls[i - 1]!.at).toBeGreaterThanOrEqual(3000);
    for (const call of calls) {
      expect(call.init).toMatchObject({
        headers: { "User-Agent": PARKS_USER_AGENT, Accept: "text/html,application/xhtml+xml" },
        cache: "no-store",
        redirect: "manual",
      });
      expect(call.init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(Schema.decodeUnknownSync(Candidate)(result.candidates[0]).listing.address).toBe(
      "18 Mount Morris Park West New York, NY 10027",
    );
    checkCandidates(result.candidates);
  });

  it.each([403, 429])(
    "stops on %s at enrichment and preserves fetched candidates/counts",
    async (status) => {
      const { fetchImpl, calls } = setup((url) => {
        if (url === indexUrl) return new Response(fixture("index"));
        if (url.endsWith("/schedule")) return new Response(fixture("M058-schedule"));
        return new Response("Blocked", { status });
      });
      const pending = parksRecCenters.collect(fetchImpl);
      await vi.runAllTimersAsync();
      const result = await pending;
      expect(calls).toHaveLength(3);
      expect(result).toMatchObject({ fetched: 3, rejected: 1 });
      expect(result.candidates).toHaveLength(2);
      checkCandidates(result.candidates);
    },
  );

  it("stops on a schedule 403 without trying later centers", async () => {
    const { fetchImpl, calls } = setup((url) =>
      url === indexUrl ? new Response(fixture("index")) : new Response("Blocked", { status: 403 }),
    );
    const pending = parksRecCenters.collect(fetchImpl);
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ fetched: 0, rejected: 0, candidates: [] });
    expect(calls).toHaveLength(2);
  });

  it("stops at an index 403 and makes no retries", async () => {
    const { fetchImpl, calls } = setup(() => new Response("Blocked", { status: 403 }));
    await expect(parksRecCenters.collect(fetchImpl)).rejects.toThrow(/index could not be read/);
    expect(calls).toHaveLength(1);
  });

  it("requests location only for centers with usable martial arts candidates", async () => {
    const { fetchImpl, calls } = setup((url) =>
      url === indexUrl
        ? new Response(fixture("index"))
        : new Response(sample().replaceAll("Karate", "Swimming").replaceAll("karate", "swimming")),
    );
    const pending = parksRecCenters.collect(fetchImpl);
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ fetched: 2, rejected: 2, candidates: [] });
    expect(calls).toHaveLength(3);
    expect(calls.slice(1).every((c) => c.url.endsWith("/schedule"))).toBe(true);
  });

  it("stops after network failure without discarding prior results", async () => {
    const { fetchImpl, calls } = setup((url) => {
      if (url === indexUrl) return new Response(fixture("index"));
      if (url.endsWith("/schedule")) return new Response(fixture("M058-schedule"));
      throw new Error("network unavailable");
    });
    const pending = parksRecCenters.collect(fetchImpl);
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(result).toMatchObject({ fetched: 3, rejected: 1 });
    expect(calls).toHaveLength(3);
    checkCandidates(result.candidates);
  });
});
