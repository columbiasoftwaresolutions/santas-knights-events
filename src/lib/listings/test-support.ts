import { Schema } from "effect";

import { Listing } from "./schema";

// A valid listing as plain input, for tests that need one. Tests override only the
// fields they care about, so they do not depend on the demo data.
export function listingInput(over: Record<string, unknown> = {}) {
  return {
    id: "l1",
    sessionId: "l1:s1",
    title: "Open mat judo",
    category: "Class",
    discipline: "Judo",
    description: "",
    borough: "Manhattan",
    neighborhood: null,
    venue: "Community center",
    latitude: null,
    longitude: null,
    day: "2026-11-12",
    startTime: "18:00",
    endTime: "19:00",
    ages: null,
    eligibility: null,
    registrationUrl: null,
    registrationNotes: null,
    sourceName: "Example source",
    sourceUrl: "https://example.org/class",
    isSample: false,
    costStatus: "free",
    evidence: {
      quote: "Open mats are free.",
      source: "Example source",
      supports: "free",
      url: "https://example.org/class",
      checkedOn: "2026-11-10",
    },
    ...over,
  };
}

export const decodeListing = (input: unknown) => Schema.decodeUnknownSync(Listing)(input);

let counter = 0;
// A decoded listing with a unique session id, for filtering and counting tests.
export function makeListing(over: Record<string, unknown> = {}) {
  counter += 1;
  return decodeListing(listingInput({ sessionId: `s${counter}`, ...over }));
}
