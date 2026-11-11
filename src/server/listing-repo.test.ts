import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { sampleRows } from "@/lib/listings/sample";
import { Listing } from "@/lib/listings/schema";

import { ListingRepo } from "./listing-repo";

const run = <A>(effect: Effect.Effect<A, unknown, ListingRepo>) =>
  Effect.runPromise(effect.pipe(Effect.provide(ListingRepo.sample)));

const search = (filters: Parameters<ListingRepo["Service"]["search"]>[0]) =>
  run(
    Effect.gen(function* () {
      const repo = yield* ListingRepo;
      return yield* repo.search(filters);
    }),
  );

describe("ListingRepo.sample", () => {
  it("returns every listing sorted by day and time, unscheduled last", async () => {
    const all = await search({ cost: "any" });
    const keys = all.map((l) => `${l.day ?? "9999"}${l.startTime ?? ""}`);
    expect(keys).toEqual([...keys].sort());
    expect(all.at(-1)?.day).toBeNull();
  });

  it("filters by borough and cost together", async () => {
    const hits = await search({ borough: "Bronx", cost: "free" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((l) => l.borough === "Bronx" && l.costStatus === "free")).toBe(true);
  });

  it("never marks a listing free without evidence", async () => {
    const all = await search({ cost: "any" });
    for (const l of all) {
      if (l.costStatus === "free" || l.costStatus === "free_with_registration") {
        expect(l.evidence, l.title).not.toBeNull();
      }
    }
  });

  it("searches across title, venue and neighborhood", async () => {
    const hits = await search({ q: "harlem" });
    expect(hits.some((l) => l.neighborhood === "Harlem")).toBe(true);
  });

  it("shows only free listings by default", async () => {
    const hits = await search({});
    expect(hits.length).toBeGreaterThan(0);
    expect(
      hits.every((l) => l.costStatus === "free" || l.costStatus === "free_with_registration"),
    ).toBe(true);
  });

  it("shows trials, sliding scale and unverified only when asked", async () => {
    const all = await search({ cost: "any" });
    const statuses = new Set(all.map((l) => l.costStatus));
    expect(statuses).toContain("free_trial_only");
    expect(statuses).toContain("sliding_scale");
    expect(statuses).toContain("unverified");
    const trials = await search({ cost: "free_trial_only" });
    expect(trials.every((l) => l.costStatus === "free_trial_only")).toBe(true);
  });

  it("gives every session its own key", async () => {
    const all = await search({ cost: "any" });
    expect(new Set(all.map((l) => l.sessionId)).size).toBe(all.length);
  });

  it("flags all sample listings so their placeholder links are never shown", async () => {
    const all = await search({ cost: "any" });
    expect(all.every((l) => l.isSample)).toBe(true);
  });
});

describe("Listing schema", () => {
  const decode = Schema.decodeUnknownSync(Listing);
  const base = sampleRows("2026-11-11").find((r) => r.costStatus === "free")!;

  it("rejects a free listing with no evidence", () => {
    expect(() => decode({ ...base, evidence: null })).toThrow(/needs evidence/);
  });

  it("accepts an unverified listing with no evidence", () => {
    expect(() => decode({ ...base, costStatus: "unverified", evidence: null })).not.toThrow();
  });

  it("rejects a source link that is not http(s)", () => {
    expect(() => decode({ ...base, sourceUrl: "javascript:alert(1)" })).toThrow();
    expect(() => decode({ ...base, registrationUrl: "data:text/html,x" })).toThrow();
  });
});
