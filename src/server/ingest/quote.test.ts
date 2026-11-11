import { describe, expect, it } from "vitest";

import { containsQuote, htmlToText } from "./quote";

describe("containsQuote", () => {
  it("finds a quote across whitespace and case differences", () => {
    expect(containsQuote("Classes are\n  100% FREE,   all year", "100% free, all year")).toBe(true);
  });

  it("treats curly quotes and non-breaking spaces as plain ones", () => {
    expect(containsQuote("It’s free for everyone", "it's free for everyone")).toBe(true);
  });

  it("rejects a quote that is not there, and an empty quote", () => {
    expect(containsQuote("Classes cost $30 a week", "all classes are free")).toBe(false);
    expect(containsQuote("anything", "   ")).toBe(false);
  });
});

describe("htmlToText", () => {
  it("drops scripts and styles and decodes entities", () => {
    const text = htmlToText(
      "<style>.a{}</style><p>Tai&nbsp;Chi &amp; Qigong</p><script>var free = true</script>",
    );
    expect(containsQuote(text, "tai chi & qigong")).toBe(true);
    expect(text).not.toMatch(/var free/);
  });
});
