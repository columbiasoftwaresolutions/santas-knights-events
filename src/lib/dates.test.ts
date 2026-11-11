import { describe, expect, it } from "vitest";

import { addDays, clock12, nyToday } from "./dates";

describe("nyToday", () => {
  it("uses the New York calendar day, not UTC", () => {
    // 03:30 UTC on Nov 12 is still 10:30 pm on Nov 11 in New York.
    expect(nyToday(new Date("2026-11-12T03:30:00Z"))).toBe("2026-11-11");
  });

  it("follows daylight saving time", () => {
    // 04:30 UTC on Jul 1 is 12:30 am in New York (UTC-4), already Jul 1.
    expect(nyToday(new Date("2026-07-01T04:30:00Z"))).toBe("2026-07-01");
    // The same instant in winter would still be the previous day.
    expect(nyToday(new Date("2026-12-01T04:30:00Z"))).toBe("2026-11-30");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("goes backwards", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("clock12", () => {
  it("formats midnight, noon and evening", () => {
    expect(clock12("00:05")).toEqual({ clock: "12:05", meridiem: "am" });
    expect(clock12("12:00")).toEqual({ clock: "12:00", meridiem: "pm" });
    expect(clock12("18:30")).toEqual({ clock: "6:30", meridiem: "pm" });
  });
});
