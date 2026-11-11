import { describe, expect, it } from "vitest";

import { listingLinks } from "./links";
import { makeListing } from "./test-support";

const registrationEvidence = {
  quote: "Free.",
  source: "Parks",
  supports: "free_with_registration",
  url: "https://www.nycgovparks.org/events/x",
  checkedOn: "2026-11-10",
};

describe("listingLinks", () => {
  it("never links out for sample data, whose URLs are placeholders", () => {
    const links = listingLinks(makeListing({ isSample: true }));
    expect(links).toEqual({ source: null, register: null, evidenceHref: null });
  });

  it("links to the official page, naming who published it", () => {
    const { source } = listingLinks(
      makeListing({ sourceName: "NYC Parks", sourceUrl: "https://www.nycgovparks.org/events/x" }),
    );
    expect(source?.href).toBe("https://www.nycgovparks.org/events/x");
    expect(source?.label).toContain("NYC Parks");
  });

  it("offers registration only when there is a registration link", () => {
    const withLink = makeListing({
      costStatus: "free_with_registration",
      evidence: registrationEvidence,
      registrationUrl: "https://nycparks.perfectmind.com/x",
    });
    expect(listingLinks(withLink).register?.href).toBe("https://nycparks.perfectmind.com/x");
    expect(listingLinks(makeListing()).register).toBeNull();
  });

  it("links the evidence page only when it differs from the listing's own page", () => {
    expect(listingLinks(makeListing()).evidenceHref).toBeNull();
    const elsewhere = makeListing({
      evidence: { ...makeListing().evidence, url: "https://www.nyc.gov/policy" },
    });
    expect(listingLinks(elsewhere).evidenceHref).toBe("https://www.nyc.gov/policy");
  });
});
