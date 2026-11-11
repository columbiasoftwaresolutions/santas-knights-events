import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { ListingRepo } from "./listing-repo";

const search = () =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repo = yield* ListingRepo;
      return yield* repo.search({ cost: "any" });
    }).pipe(Effect.provide(ListingRepo.sample)),
  );

// The demo data must stay valid, because it is what a developer sees without Supabase.
describe("sample data", () => {
  it("decodes as real listings, each session with its own key, all flagged as sample", async () => {
    const all = await search();
    expect(all.length).toBeGreaterThan(0);
    expect(new Set(all.map((l) => l.sessionId)).size).toBe(all.length);
    expect(all.every((l) => l.isSample)).toBe(true);
  });
});
