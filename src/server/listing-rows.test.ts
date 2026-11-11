import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { Listing } from "@/lib/listings/schema";

import { projectListings, type ListingRow } from "./listing-rows";

const decode = Schema.decodeUnknownSync(Schema.Array(Listing));
const TODAY = "2026-11-11";

const row = (over: Partial<ListingRow> = {}): ListingRow => ({
  id: "l1",
  title: "Tai Chi Advanced",
  description: null,
  ages_text: "Ages 60 and older",
  eligibility: null,
  venue: "Grand St OAC",
  borough: "Manhattan",
  neighborhood: null,
  latitude: null,
  longitude: null,
  cost_status: "free_with_registration",
  registration_url: null,
  registration_notes: null,
  source_url: "https://data.cityofnewyork.us/d/fzy4-e84j",
  category: { name: "Class" },
  discipline: { name: "Tai chi" },
  source: { name: "NYC Aging older adult centers" },
  listing_occurrences: [
    {
      id: "o1",
      starts_at: "2026-11-17T13:00:00Z",
      ends_at: "2026-11-17T14:00:00Z",
      cancelled: false,
    },
  ],
  listing_evidence: [
    {
      quote:
        "Older adult center membership is free and open to all New Yorkers, ages 60 and older.",
      url: "https://www.nyc.gov/site/dfta/services/older-adult-center.page",
      captured_at: "2026-11-11T17:00:00Z",
      supports_cost_status: "free_with_registration",
      source: null,
    },
  ],
  ...over,
});

describe("projectListings", () => {
  it("turns an occurrence into a New York day and time that decodes as a Listing", () => {
    const [s] = decode(projectListings([row()], TODAY));
    expect(s!.day).toBe("2026-11-17");
    expect(s!.startTime).toBe("08:00");
    expect(s!.endTime).toBe("09:00");
    expect(s!.sessionId).toBe("o1");
    expect(s!.evidence?.checkedOn).toBe("2026-11-11");
    expect(s!.evidence?.source).toBe("NYC Aging older adult centers");
    expect(s!.isSample).toBe(false);
  });

  it("makes one session per occurrence inside the week and drops the rest", () => {
    const r = row({
      listing_occurrences: [
        { id: "a", starts_at: "2026-11-10T15:00:00Z", ends_at: null, cancelled: false }, // yesterday
        { id: "b", starts_at: "2026-11-12T15:00:00Z", ends_at: null, cancelled: false },
        { id: "c", starts_at: "2026-11-17T15:00:00Z", ends_at: null, cancelled: false }, // day 7
        { id: "d", starts_at: "2026-11-18T15:00:00Z", ends_at: null, cancelled: false }, // beyond
        { id: "e", starts_at: "2026-11-13T15:00:00Z", ends_at: null, cancelled: true },
      ],
    });
    expect(decode(projectListings([r], TODAY)).map((s) => s.sessionId)).toEqual(["b", "c"]);
  });

  it("shows a listing with no sessions at all as unscheduled", () => {
    const [s] = decode(projectListings([row({ listing_occurrences: [] })], TODAY));
    expect(s).toMatchObject({ day: null, startTime: null, sessionId: "l1:unscheduled" });
  });

  it("hides a listing whose only sessions are outside this week", () => {
    const r = row({
      listing_occurrences: [
        { id: "x", starts_at: "2027-01-05T15:00:00Z", ends_at: null, cancelled: false },
      ],
    });
    expect(projectListings([r], TODAY)).toEqual([]);
  });

  it("uses only evidence that supports the current status, newest first", () => {
    const r = row({
      listing_evidence: [
        {
          quote: "old",
          url: "https://a.org/",
          captured_at: "2026-10-01T00:00:00Z",
          supports_cost_status: "free_with_registration",
          source: null,
        },
        {
          quote: "new",
          url: "https://a.org/",
          captured_at: "2026-11-01T00:00:00Z",
          supports_cost_status: "free_with_registration",
          source: null,
        },
        {
          quote: "trial",
          url: "https://a.org/",
          captured_at: "2026-11-05T00:00:00Z",
          supports_cost_status: "free_trial_only",
          source: null,
        },
      ],
    });
    const [s] = decode(projectListings([r], TODAY));
    expect(s!.evidence?.quote).toBe("new");
  });

  it("handles an unverified listing with no evidence and an unknown borough", () => {
    const [s] = decode(
      projectListings(
        [row({ cost_status: "unverified", listing_evidence: [], borough: "Atlantis" })],
        TODAY,
      ),
    );
    expect(s!.evidence).toBeNull();
    expect(s!.borough).toBeNull();
  });
});
