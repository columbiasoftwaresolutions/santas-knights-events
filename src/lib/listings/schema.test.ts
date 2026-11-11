import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { sampleRows } from "./sample";
import { ClockTime, IsoDate, Listing } from "./schema";

const decode = Schema.decodeUnknownSync(Listing);
const rows = sampleRows("2026-11-11");
const free = rows.find((r) => r.costStatus === "free")!;
const withReg = rows.find((r) => r.costStatus === "free_with_registration")!;

describe("Listing: a free claim needs matching evidence", () => {
  it("rejects a free listing with no evidence", () => {
    expect(() => decode({ ...free, evidence: null })).toThrow(/needs evidence/);
  });

  it("rejects free_with_registration with no evidence", () => {
    expect(() => decode({ ...withReg, evidence: null })).toThrow(/needs evidence/);
  });

  it("rejects evidence that supports a different status", () => {
    expect(() =>
      decode({ ...free, evidence: { ...free.evidence, supports: "free_trial_only" } }),
    ).toThrow(/exact status/);
    expect(() =>
      decode({ ...withReg, evidence: { ...withReg.evidence, supports: "free" } }),
    ).toThrow(/exact status/);
  });

  it("rejects blank evidence text", () => {
    expect(() => decode({ ...free, evidence: { ...free.evidence, quote: "  " } })).toThrow();
    expect(() => decode({ ...free, evidence: { ...free.evidence, source: "" } })).toThrow();
  });

  it("rejects an evidence date that is not a real date", () => {
    expect(() =>
      decode({ ...free, evidence: { ...free.evidence, checkedOn: "bad-date" } }),
    ).toThrow();
    expect(() =>
      decode({ ...free, evidence: { ...free.evidence, checkedOn: "2026-02-31" } }),
    ).toThrow();
  });

  it("accepts an unverified listing with no evidence", () => {
    expect(() => decode({ ...free, costStatus: "unverified", evidence: null })).not.toThrow();
  });

  it("accepts a trial listing whose evidence supports the trial", () => {
    expect(() =>
      decode({
        ...free,
        costStatus: "free_trial_only",
        evidence: { ...free.evidence, supports: "free_trial_only" },
      }),
    ).not.toThrow();
  });
});

describe("Listing: links and times", () => {
  it("rejects a source or registration link that is not http(s)", () => {
    expect(() => decode({ ...free, sourceUrl: "javascript:alert(1)" })).toThrow();
    expect(() => decode({ ...withReg, registrationUrl: "data:text/html,x" })).toThrow();
  });

  it("rejects a malformed day or clock time", () => {
    expect(() => decode({ ...free, day: "next tuesday" })).toThrow();
    expect(() => decode({ ...free, startTime: "25:00" })).toThrow();
    expect(() => decode({ ...free, endTime: "9:30" })).toThrow();
  });

  it("rejects a blank source name", () => {
    expect(() => decode({ ...free, sourceName: " " })).toThrow();
  });
});

describe("IsoDate and ClockTime", () => {
  it("know a real date from an impossible one", () => {
    const date = Schema.decodeUnknownSync(IsoDate);
    expect(date("2028-02-29")).toBe("2028-02-29");
    expect(() => date("2026-02-29")).toThrow();
    expect(() => date("2026-13-01")).toThrow();
  });

  it("accept 24-hour times only", () => {
    const time = Schema.decodeUnknownSync(ClockTime);
    expect(time("00:00")).toBe("00:00");
    expect(time("23:59")).toBe("23:59");
    expect(() => time("24:00")).toThrow();
    expect(() => time("12:60")).toThrow();
  });
});
