import { describe, expect, it } from "vitest";

import { hrefFor, parseFilters, toggleHref } from "./params";

describe("parseFilters", () => {
  it("keeps valid values and drops unknown ones", () => {
    expect(
      parseFilters({ borough: "Queens", cost: "free", day: "2026-11-12", q: " judo " }),
    ).toEqual({
      q: "judo",
      borough: "Queens",
      discipline: undefined,
      cost: "free",
      day: "2026-11-12",
    });
    const bad = parseFilters({ borough: "Atlantis", cost: "cheap", day: "tomorrow" });
    expect(bad.borough).toBeUndefined();
    expect(bad.cost).toBeUndefined();
    expect(bad.day).toBeUndefined();
  });

  it("takes the first value of a repeated parameter", () => {
    expect(parseFilters({ borough: ["Bronx", "Queens"] }).borough).toBe("Bronx");
  });
});

describe("toggleHref", () => {
  it("sets a filter and clears it when clicked again", () => {
    expect(toggleHref({}, "borough", "Bronx")).toBe("/?borough=Bronx");
    expect(toggleHref({ borough: "Bronx" }, "borough", "Bronx")).toBe("/");
  });

  it("keeps the other filters", () => {
    expect(toggleHref({ cost: "free" }, "borough", "Bronx")).toBe("/?cost=free&borough=Bronx");
  });
});

describe("hrefFor", () => {
  it("returns the root for no values", () => {
    expect(hrefFor({})).toBe("/");
    expect(hrefFor({ q: undefined })).toBe("/");
  });
});
