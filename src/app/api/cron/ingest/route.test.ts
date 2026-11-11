import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ status: "succeeded", privilegedRuns: 0 }));
vi.mock("@/server/ingest/registry", () => ({ SOURCES: { test: () => ({}) } }));
vi.mock("@/server/supabase", () => ({ Supabase: { admin: Layer.empty } }));
vi.mock("@/server/ingest/runner", () => ({
  runSource: () => {
    state.privilegedRuns++;
    return Effect.succeed({ status: state.status });
  },
}));

import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  state.status = "succeeded";
  state.privilegedRuns = 0;
});
const request = (token?: string) =>
  new Request("https://example.org/api/cron/ingest?source=test", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

describe("cron boundary", () => {
  it("refuses missing or incorrect credentials before privileged work", async () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("wrong"))).status).toBe(401);
    expect(state.privilegedRuns).toBe(0);
  });
  it.each(["failed", "partial"])(
    "returns a non-success HTTP status for a %s run",
    async (status) => {
      vi.stubEnv("CRON_SECRET", "test-secret");
      state.status = status;
      expect((await GET(request("test-secret"))).ok).toBe(false);
    },
  );
  it("returns success for a completed run", async () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    expect((await GET(request("test-secret"))).ok).toBe(true);
  });
});
