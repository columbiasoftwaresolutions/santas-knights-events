import { describe, expect, it } from "vitest";

import { buildDirectory, filterListings } from "./directory";
import { makeListing } from "./test-support";

const trialEvidence = {
  quote: "First class free.",
  source: "Studio",
  supports: "free_trial_only",
  url: "https://example.org/trial",
  checkedOn: "2026-11-10",
};

const all = [
  makeListing({
    title: "Open mat judo",
    borough: "Bronx",
    neighborhood: "Mott Haven",
    day: "2026-11-12",
  }),
  makeListing({ title: "Tai chi", discipline: "Tai chi", borough: "Brooklyn", day: "2026-11-13" }),
  makeListing({
    title: "Kids karate",
    discipline: "Karate",
    borough: "Brooklyn",
    day: "2026-11-13",
    costStatus: "free_trial_only",
    evidence: trialEvidence,
  }),
  makeListing({ title: "Mystery class", costStatus: "unverified", evidence: null, day: null }),
];

describe("filtering", () => {
  it("shows only free sessions unless a cost is chosen", () => {
    const titles = filterListings(all, {}).map((l) => l.title);
    expect(titles).not.toContain("Kids karate");
    expect(titles).not.toContain("Mystery class");
    expect(filterListings(all, { cost: "free_trial_only" }).map((l) => l.title)).toEqual([
      "Kids karate",
    ]);
  });

  it("searches location as well as title", () => {
    expect(filterListings(all, { q: "mott haven" }).map((l) => l.title)).toEqual(["Open mat judo"]);
  });

  it("applies filters together", () => {
    expect(filterListings(all, { borough: "Brooklyn" }).map((l) => l.title)).toEqual(["Tai chi"]);
  });

  it("lists unscheduled sessions last", () => {
    const sorted = filterListings(all, { cost: "any" });
    expect(sorted.at(-1)?.title).toBe("Mystery class");
  });
});

describe("counts say what a click would show", () => {
  it("counts every cost status even though results default to free", () => {
    const { counts } = buildDirectory(all, {});
    expect(counts.cost.free_trial_only).toBe(1);
    expect(counts.cost.unverified).toBe(1);
  });

  it("ignores a facet's own filter when counting it", () => {
    const { counts } = buildDirectory(all, { borough: "Bronx" });
    expect(counts.borough.Brooklyn).toBeGreaterThan(0);
  });

  it("keeps every day in the week list when a day is selected", () => {
    const { results, forWeek } = buildDirectory(all, { day: "2026-11-12" });
    expect(results.map((l) => l.day)).toEqual(["2026-11-12"]);
    expect(new Set(forWeek.map((l) => l.day)).size).toBeGreaterThan(1);
  });
});
