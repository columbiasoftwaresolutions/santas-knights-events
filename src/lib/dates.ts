// New York local dates as YYYY-MM-DD strings, which sort and compare as text.

const NY = "America/New_York";

export function nyToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NY }).format(now);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayShort(day: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );
}

export function dayNumber(day: string): number {
  return Number(day.slice(8, 10));
}

export function longDay(day: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

export function shortDate(day: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

// "18:30" -> { clock: "6:30", meridiem: "pm" }
export function clock12(t: string): { clock: string; meridiem: string } {
  const [h, m] = t.split(":").map(Number);
  return {
    clock: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}`,
    meridiem: h >= 12 ? "pm" : "am",
  };
}
