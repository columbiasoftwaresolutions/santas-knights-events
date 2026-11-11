import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { listingLinks } from "./links";
import { sampleRows } from "./sample";
import { Listing } from "./schema";

const decode = Schema.decodeUnknownSync(Listing);
const base = sampleRows("2026-11-11").find((r) => r.costStatus === "free_with_registration")!;
const real = (over: Record<string, unknown> = {}) =>
  decode({
    ...base,
    isSample: false,
    sourceName: "NYC Parks",
    sourceUrl: "https://www.nycgovparks.org/events/2026/11/18/example",
    registrationUrl: "https://nycparks.perfectmind.com/example",
    evidence: { ...base.evidence, url: "https://www.nycgovparks.org/events/2026/11/18/example" },
    ...over,
  });

describe("listingLinks", () => {
  it("never links out for sample listings", () => {
    const sample = decode(base);
    expect(listingLinks(sample)).toEqual({ source: null, register: null, evidenceHref: null });
  });

  it("links to the official page and names the publisher", () => {
    const { source } = listingLinks(real());
    expect(source).toEqual({
      href: "https://www.nycgovparks.org/events/2026/11/18/example",
      label: "View on NYC Parks",
    });
  });

  it("links to registration only when there is a registration URL", () => {
    expect(listingLinks(real()).register?.href).toBe("https://nycparks.perfectmind.com/example");
    expect(listingLinks(real({ registrationUrl: null })).register).toBeNull();
  });

  it("links the evidence only when it is a different page than the listing", () => {
    expect(listingLinks(real()).evidenceHref).toBeNull();
    const other = "https://www.nyc.gov/site/dycd/beacon.page";
    expect(listingLinks(real({ evidence: { ...base.evidence, url: other } })).evidenceHref).toBe(
      other,
    );
  });
});
