import { describe, expect, it } from "vitest";

import { parseFilters, toggleHref } from "./params";

describe("parseFilters treats the URL as untrusted", () => {
  it("keeps valid values and drops unknown ones", () => {
    const f = parseFilters({ borough: "Queens", cost: "free", day: "2026-11-12", q: " judo " });
    expect(f).toMatchObject({ borough: "Queens", cost: "free", day: "2026-11-12", q: "judo" });
    const bad = parseFilters({ borough: "Atlantis", cost: "cheap", day: "tomorrow" });
    expect([bad.borough, bad.cost, bad.day]).toEqual([undefined, undefined, undefined]);
  });

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
    expect(toggleHref({ cost: "free" }, "borough", "Bronx")).toMatch(/cost=free.*borough=Bronx/);
  });

  it("clears a filter when given an empty value (how the default scope is selected)", () => {
    expect(toggleHref({ cost: "free_trial_only" }, "cost", "")).toBe("/");
  });
});
