import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchText } from "./http";

const sequence = (...statuses: number[]) => {
  let calls = 0;
  const impl = async () => {
    const status = statuses[Math.min(calls++, statuses.length - 1)]!;
    return new Response(status === 200 ? "ok" : "no", { status });
  };
  return { impl: impl as unknown as typeof fetch, calls: () => calls };
};

describe("fetchText", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it("retries a busy server and then succeeds", async () => {
    const s = sequence(503, 503, 200);
    const pending = expect(fetchText("https://example.org/", { fetchImpl: s.impl })).resolves.toBe(
      "ok",
    );
    await vi.runAllTimersAsync();
    await pending;
    expect(s.calls()).toBe(3);
  });

  it("gives up after three tries on a persistent 503", async () => {
    const s = sequence(503);
    const pending = expect(
      fetchText("https://example.org/", { fetchImpl: s.impl }),
    ).rejects.toThrow();
    await vi.runAllTimersAsync();
    await pending;
    expect(s.calls()).toBe(3);
  });

  it("does not retry a refusal", async () => {
    const statuses = [403, 404, 429];
    const runs = statuses.map((status) => ({ status, s: sequence(status) }));
    const messages = await Promise.all(
      runs.map(({ s }) =>
        fetchText("https://example.org/", { fetchImpl: s.impl, retryDelayMs: 1 }).then(
          () => "fetched",
          (e: Error) => e.message,
        ),
      ),
    );
    messages.forEach((message, i) => expect(message).toContain(String(statuses[i])));
    runs.forEach(({ s }) => expect(s.calls()).toBe(1));
  });
});
