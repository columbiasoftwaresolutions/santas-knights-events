import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { HttpUrl, normalizeSourceUrl, parseHttpUrl } from "./url";

describe("parseHttpUrl", () => {
  it("accepts http and https", () => {
    expect(parseHttpUrl("https://example.org/a?b=1")?.hostname).toBe("example.org");
    expect(parseHttpUrl("http://example.org")?.protocol).toBe("http:");
  });

  it("rejects other schemes, credentials and junk", () => {
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("data:text/html,<b>x</b>")).toBeNull();
    expect(parseHttpUrl("ftp://example.org/file")).toBeNull();
    expect(parseHttpUrl("https://user:pass@example.org/")).toBeNull();
    expect(parseHttpUrl("//example.org/no-scheme")).toBeNull();
    expect(parseHttpUrl("not a url")).toBeNull();
    expect(parseHttpUrl("")).toBeNull();
  });
});

describe("normalizeSourceUrl", () => {
  it("upgrades Parks links to https", () => {
    expect(normalizeSourceUrl("http://www.nycgovparks.org/events/2026/11/18/intensati")).toBe(
      "https://www.nycgovparks.org/events/2026/11/18/intensati",
    );
  });

  it("leaves other http hosts alone, since we cannot know they serve https", () => {
    expect(normalizeSourceUrl("http://example.org/x")).toBe("http://example.org/x");
  });

  it("returns null for unusable input", () => {
    expect(normalizeSourceUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("HttpUrl schema", () => {
  const decode = Schema.decodeUnknownSync(HttpUrl);
  it("decodes a good URL and throws on a bad one", () => {
    expect(decode("https://example.org")).toBe("https://example.org");
    expect(() => decode("javascript:alert(1)")).toThrow();
  });
});
