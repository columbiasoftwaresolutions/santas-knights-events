import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { Listing } from "./schema";
import { decodeListing, listingInput } from "./test-support";

const free = listingInput();
const withRegistration = listingInput({
  costStatus: "free_with_registration",
  evidence: { ...free.evidence, supports: "free_with_registration" },
});

describe("a free listing must carry evidence for that exact claim", () => {
  it("rejects both free statuses with no evidence", () => {
    expect(() => decodeListing({ ...free, evidence: null })).toThrow();
    expect(() => decodeListing({ ...withRegistration, evidence: null })).toThrow();
  });

  it("rejects evidence that supports a different status", () => {
    expect(() =>
      decodeListing({ ...free, evidence: { ...free.evidence, supports: "free_trial_only" } }),
    ).toThrow();
    expect(() =>
      decodeListing({
        ...withRegistration,
        evidence: { ...withRegistration.evidence, supports: "free" },
      }),
    ).toThrow();
  });

  it("accepts the matching claim, and an unverified listing without evidence", () => {
    expect(() => decodeListing(free)).not.toThrow();
    expect(() => decodeListing(withRegistration)).not.toThrow();
    expect(() =>
      decodeListing({ ...free, costStatus: "unverified", evidence: null }),
    ).not.toThrow();
  });
});

describe("what would crash or mislead the page is rejected at the boundary", () => {
  it("rejects blank evidence text and dates that do not exist", () => {
    expect(() => decodeListing({ ...free, evidence: { ...free.evidence, quote: "  " } })).toThrow();
    expect(() =>
      decodeListing({ ...free, evidence: { ...free.evidence, checkedOn: "2026-02-31" } }),
    ).toThrow();
  });

  it("rejects an impossible day or clock time", () => {
    expect(Schema.decodeUnknownResult(Listing)({ ...free, day: "2026-13-01" })._tag).toBe(
      "Failure",
    );
    expect(() => decodeListing({ ...free, startTime: "25:00" })).toThrow();
  });

  it("rejects source and registration links that are not plain http(s)", () => {
    expect(() => decodeListing({ ...free, sourceUrl: "javascript:alert(1)" })).toThrow();
    expect(() => decodeListing({ ...free, registrationUrl: "data:text/html,x" })).toThrow();
  });
});
