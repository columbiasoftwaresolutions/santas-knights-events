import { describe, expect, it } from "vitest";

import { activeFilters, DEFAULT_SCOPE, filterSummary } from "./active-filters";

describe("active filters", () => {
  it("is empty, and summarized as the default scope, when nothing is set", () => {
    expect(activeFilters({})).toEqual([]);
    expect(filterSummary({})).toBe(DEFAULT_SCOPE);
  });

  it("has one entry per filter the visitor set, each removable by its key", () => {
    const set = activeFilters({ q: "judo", borough: "Brooklyn", day: "2026-11-14" });
    expect(set.map((a) => a.key)).toEqual(["q", "borough", "day"]);
    expect(set.every((a) => a.label.length > 0)).toBe(true);
  });
});
