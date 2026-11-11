import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { buildDirectory, filterListings } from "./directory";
import { sampleRows } from "./sample";
import { Listing } from "./schema";

const all = Schema.decodeUnknownSync(Schema.Array(Listing))(sampleRows("2026-11-11"));

describe("filterListings", () => {
  it("matches a neighborhood that is not in the title", () => {
    const hits = filterListings(all, { q: "harlem", cost: "any" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((l) => l.neighborhood === "Harlem")).toBe(true);
  });

  it("applies filters together", () => {
    const hits = filterListings(all, { borough: "Bronx", cost: "free" });
    expect(hits.every((l) => l.borough === "Bronx" && l.costStatus === "free")).toBe(true);
  });
});

describe("buildDirectory", () => {
  it("counts every cost status even though results default to free", () => {
    const d = buildDirectory(all, {});
    expect(
      d.results.every((l) => l.costStatus.startsWith("free") && l.costStatus !== "free_trial_only"),
    ).toBe(true);
    expect(d.counts.cost.free_trial_only).toBeGreaterThan(0);
    expect(d.counts.cost.unverified).toBeGreaterThan(0);
  });

  it("counts a facet without its own filter, so counts say what a click would show", () => {
    const d = buildDirectory(all, { borough: "Bronx" });
    // Borough counts ignore the borough filter, so other boroughs still have counts.
    expect(d.counts.borough.Manhattan).toBeGreaterThan(0);
    // Discipline counts respect the borough filter.
    const bronxDisciplines = filterListings(all, { borough: "Bronx" }).map((l) => l.discipline);
    expect(Object.keys(d.counts.discipline).sort()).toEqual(
      [...new Set(bronxDisciplines.filter(Boolean))].sort() as string[],
    );
  });

  it("keeps every day in the week list when a day is selected", () => {
    const day = all.find((l) => l.day)!.day!;
    const d = buildDirectory(all, { day });
    expect(d.results.every((l) => l.day === day)).toBe(true);
    expect(new Set(d.forWeek.map((l) => l.day)).size).toBeGreaterThan(1);
  });
});
