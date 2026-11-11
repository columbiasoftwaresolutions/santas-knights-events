import { describe, expect, it } from "vitest";

import { addDays, clock12, nyInstant, nyLocal, nyToday, parseClock } from "./dates";

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

describe("nyLocal and nyInstant", () => {
  it("reads a stored instant as New York wall-clock time", () => {
    expect(nyLocal("2026-11-11T23:30:00Z")).toEqual({ day: "2026-11-11", time: "18:30" });
    expect(nyLocal("2026-07-01T04:30:00Z")).toEqual({ day: "2026-07-01", time: "00:30" });
  });

  it("builds an instant with the right offset in winter and summer", () => {
    expect(nyInstant("2026-11-11", "18:30")).toBe("2026-11-11T18:30:00-05:00");
    expect(nyInstant("2026-07-01", "18:30")).toBe("2026-07-01T18:30:00-04:00");
  });

  it("round-trips across the daylight saving changes", () => {
    for (const [day, time] of [
      ["2026-11-01", "00:30"],
      ["2026-11-01", "03:00"],
      ["2026-03-08", "03:30"],
    ] as const) {
      const iso = nyInstant(day, time)!;
      expect(nyLocal(iso)).toEqual({ day, time });
    }
  });

  it("returns null for a time that does not exist or is malformed", () => {
    expect(nyInstant("2026-03-08", "02:30")).toBeNull();
    expect(nyInstant("2026-11-11", "25:00")).toBeNull();
    expect(nyInstant("soon", "18:30")).toBeNull();
  });
});

describe("parseClock", () => {
  it("reads 12-hour times as written by sources", () => {
    expect(parseClock("5:15 pm")).toBe("17:15");
    expect(parseClock("12:00 p")).toBe("12:00");
    expect(parseClock("12:00 a")).toBe("00:00");
    expect(parseClock("9 AM")).toBe("09:00");
  });

  it("rejects anything else", () => {
    expect(parseClock("noon")).toBeNull();
    expect(parseClock("13:00 pm")).toBeNull();
    expect(parseClock("")).toBeNull();
  });
});
