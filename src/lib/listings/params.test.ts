import { describe, expect, it } from "vitest";

import { parseFilters, toggleHref } from "./params";

describe("parseFilters treats the URL as untrusted", () => {
  it("keeps valid values and drops unknown ones", () => {
    const f = parseFilters({ borough: "Queens", cost: "free", day: "2026-11-12", q: " judo " });
    expect(f).toMatchObject({ borough: "Queens", cost: "free", day: "2026-11-12", q: "judo" });
    const bad = parseFilters({ borough: "Atlantis", cost: "cheap", day: "tomorrow" });
    expect([bad.borough, bad.cost, bad.day]).toEqual([undefined, undefined, undefined]);
  });

  it.each(["2026-13-01", "2026-02-31", "2025-02-29"])(
    "ignores impossible calendar date %s",
    (day) => {
      expect(parseFilters({ day }).day).toBeUndefined();
    },
  );

  it("cannot be talked into the internal 'any' cost", () => {
    expect(parseFilters({ cost: "any" }).cost).toBeUndefined();
  });

  it("takes the first value of a repeated parameter", () => {
    expect(parseFilters({ borough: ["Bronx", "Queens"] }).borough).toBe("Bronx");
  });
});

describe("toggleHref", () => {
  it("sets a filter, clears it when clicked again, and keeps the others", () => {
    expect(toggleHref({}, "borough", "Bronx")).toContain("borough=Bronx");
    expect(toggleHref({ borough: "Bronx" }, "borough", "Bronx")).toBe("/");
    const params = new URL(toggleHref({ cost: "free" }, "borough", "Bronx"), "https://example.org")
      .searchParams;
    expect(params.get("cost")).toBe("free");
    expect(params.get("borough")).toBe("Bronx");
  });

  it("clears a filter when given an empty value (how the default scope is selected)", () => {
    expect(toggleHref({ cost: "free_trial_only" }, "cost", "")).toBe("/");
  });
});
