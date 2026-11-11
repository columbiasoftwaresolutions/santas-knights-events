import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { Candidate } from "../types";
import { curated, CURATED } from "./curated";
import { parseOac, OAC_POLICY_QUOTE } from "./nyc-aging-oac";
import { freeSentence, parseParksEvents } from "./parks-events";

const decode = Schema.decodeUnknownSync(Candidate);
const FETCHED = "2026-11-11T17:00:00.000Z";

describe("parks events", () => {
  const rows = [
    {
      title: "Free Tai Chi in the Park",
      guid: "111",
      description: "Gentle moves for all levels. This class is free! Bring water.",
      link: { url: "http://www.nycgovparks.org/events/2026/11/18/tai-chi" },
      registration_url: { url: "https://nycparks.perfectmind.com/x" },
      registration_description: "Registration has begun.",
      parkids: "X123",
      parknames: "Crotona Park",
      location: "Near the pool",
      starttime: "2026-11-18T10:00:00.000",
      endtime: "2026-11-18T11:00:00.000",
      coordinates: "40.8386, -73.8947",
    },
    {
      title: "intenSati",
      guid: "222",
      description: "dance meets kickboxing meets yoga",
      link: { url: "http://www.nycgovparks.org/events/x" },
      starttime: "2026-11-18T17:15:00.000",
    },
    {
      title: "Karate Basics",
      guid: "333",
      description: "Ages 8 and up.",
      link: { url: "http://www.nycgovparks.org/events/k" },
      starttime: "2026-07-01T18:00:00.000",
      parkids: "M001",
    },
    {
      title: "Judo",
      guid: "444",
      link: { url: "javascript:alert(1)" },
      starttime: "2026-11-18T10:00:00.000",
    },
  ];
  const result = parseParksEvents(JSON.stringify(rows), FETCHED);

  it("keeps martial arts titles and counts what it dropped", () => {
    expect(result.fetched).toBe(4);
    expect(result.candidates).toHaveLength(2);
    expect(result.rejected).toBe(2);
  });

  it("does not treat a description that mentions kickboxing as a martial arts class", () => {
    const keys = result.candidates.map((c) => decode(c).listing.external_id);
    expect(keys).not.toContain("222");
  });

  it("quotes the free sentence, upgrades links to https and reads the borough from the park id", () => {
    const c = decode(result.candidates[0]);
    expect(c.listing.cost_status).toBe("free_with_registration");
    expect(c.evidence[0]!.quote).toBe("This class is free!");
    expect(c.listing.source_url).toBe("https://www.nycgovparks.org/events/2026/11/18/tai-chi");
    expect(c.listing.borough).toBe("Bronx");
    expect(c.listing.latitude).toBeCloseTo(40.8386);
    expect(c.occurrences[0]!.starts_at).toBe("2026-11-18T10:00:00-05:00");
  });

  it("stays unverified when the description says nothing about cost, and handles summer time", () => {
    const c = decode(result.candidates[1]);
    expect(c.listing.cost_status).toBe("unverified");
    expect(c.evidence).toEqual([]);
    expect(c.occurrences[0]!.starts_at).toBe("2026-07-01T18:00:00-04:00");
  });

  it("finds only an explicit free sentence", () => {
    expect(freeSentence("Fitness for all. Free to join. Meet at the lawn.")).toBe("Free to join.");
    expect(freeSentence("Registration required. $20 fee.")).toBeNull();
    expect(freeSentence("Not free for non-members.")).toBeNull();
  });
});

describe("NYC Aging older adult centers", () => {
  const rows = [
    {
      dfta_id: "C1",
      providername: "Grand St OAC",
      eventname: "Tai Chi Advanced",
      eventlocation: "175  Delancey street 4th floor",
      zipcode: "10002",
      borough: "MANHATTAN",
      starttime: "2026-11-17T08:00:00.000",
      endtime: "2026-11-17T09:00:00.000",
      isvirtual: "No",
      latitude: "40.7174",
      longitude: "-73.985",
    },
    {
      dfta_id: "C1",
      providername: "Grand St OAC",
      eventname: "Tai Chi Advanced",
      eventlocation: "175  Delancey street 4th floor",
      zipcode: "10002",
      borough: "Manhattan",
      starttime: "2026-11-24T08:00:00.000",
      endtime: "2026-11-24T09:00:00.000",
      isvirtual: "No",
    },
    {
      dfta_id: "C1",
      eventname: "Tai Chi Advanced",
      starttime: "2026-11-10T08:00:00.000",
      isvirtual: "No",
    },
    {
      dfta_id: "C2",
      eventname: "Tai Chi online",
      starttime: "2026-11-17T08:00:00.000",
      isvirtual: "Yes",
    },
    { dfta_id: "C3", eventname: "Bingo", starttime: "2026-11-17T08:00:00.000", isvirtual: "No" },
  ];

  it("groups sessions into one listing and skips past, virtual and unrelated rows", () => {
    const r = parseOac(JSON.stringify(rows), FETCHED, true, "2026-11-11");
    expect(r.fetched).toBe(5);
    expect(r.candidates).toHaveLength(1);
    expect(r.rejected).toBe(3);
    const c = decode(r.candidates[0]);
    expect(c.occurrences).toHaveLength(2);
    expect(c.listing.borough).toBe("Manhattan");
    expect(c.listing.address).toBe("175 Delancey street 4th floor, 10002");
  });

  it("is free with registration only while the policy quote is verified", () => {
    const ok = decode(parseOac(JSON.stringify(rows), FETCHED, true, "2026-11-11").candidates[0]);
    expect(ok.listing.cost_status).toBe("free_with_registration");
    expect(ok.evidence[0]!.quote).toBe(OAC_POLICY_QUOTE);
    const gone = decode(parseOac(JSON.stringify(rows), FETCHED, false, "2026-11-11").candidates[0]);
    expect(gone.listing.cost_status).toBe("unverified");
    expect(gone.evidence).toEqual([]);
  });
});

describe("an outage answer is a failure, not an empty source", () => {
  const outage = JSON.stringify({
    message: "Service unavailable",
    errorCode: "service-unavailable",
  });
  it("throws for both Open Data adapters", () => {
    expect(() => parseOac(outage, FETCHED, true, "2026-11-11")).toThrow(/Unexpected response/);
    expect(() => parseParksEvents(outage, FETCHED)).toThrow(/Unexpected response/);
  });
});

describe("curated listings", () => {
  const page = (text: string) => async () =>
    new Response(`<html><body><p>${text}</p></body></html>`);

  it("keeps the free status when the quote is on the page", async () => {
    const source = curated(
      page("Hello. All classes are 100% FREE, 100% of the time, no-questions-asked! Bye."),
      CURATED.slice(0, 1),
    );
    const result = await source.collect();
    const c = decode(result.candidates[0]);
    expect(c.listing.cost_status).toBe("free_with_registration");
    expect(c.evidence[0]!.method).toBe("curated");
  });

  it("drops to unverified, keeping the listing, when the quote is gone", async () => {
    const source = curated(page("Classes cost $30 a week."), CURATED.slice(0, 1));
    const c = decode((await source.collect()).candidates[0]);
    expect(c.listing.cost_status).toBe("unverified");
    expect(c.evidence).toEqual([]);
  });

  it("drops to unverified when the page cannot be read", async () => {
    const source = curated(async () => new Response("no", { status: 403 }), CURATED.slice(0, 1));
    expect(decode((await source.collect()).candidates[0]).listing.cost_status).toBe("unverified");
  });

  it("every shipped entry is a valid candidate", async () => {
    const source = curated(async () => new Response("<p>nothing</p>"));
    const { candidates } = await source.collect();
    expect(candidates).toHaveLength(CURATED.length);
    for (const c of candidates) expect(() => decode(c)).not.toThrow();
  });
});
