import { describe, expect, it } from "vitest";

import { activeFilters, filterSummary } from "./active-filters";

describe("activeFilters", () => {
  it("is empty for the default view", () => {
    expect(activeFilters({})).toEqual([]);
    expect(filterSummary({})).toBe("All free sessions");
  });

  it("names each filter in plain words", () => {
    const f = activeFilters({
      q: "judo",
      cost: "free_trial_only",
      borough: "Brooklyn",
      discipline: "Judo",
      day: "2026-11-14",
    });
    expect(f.map((a) => a.label)).toEqual([
      "“judo”",
      "Free trial only",
      "Brooklyn",
      "Judo",
      "Nov 14",
    ]);
  });

  it("summarizes for the mobile disclosure", () => {
    expect(filterSummary({ borough: "Bronx", cost: "free" })).toBe("Free, Bronx");
  });
});
