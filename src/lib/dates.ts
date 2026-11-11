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

// --- Instants <-> New York wall-clock time ---------------------------------

const NY_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: NY,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// A stored instant, as the New York date and HH:mm a visitor would see.
export function nyLocal(instant: string | Date): { day: string; time: string } {
  const parts = Object.fromEntries(
    NY_PARTS.formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

// New York wall-clock date and time to an ISO instant with the right UTC offset
// (-05:00 or -04:00), so daylight saving is handled. Returns null for a time that
// does not exist (the spring-forward gap) or input that is not a date and time.
export function nyInstant(day: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  for (const offsetHours of [5, 4]) {
    const iso = `${day}T${time}:00-0${offsetHours}:00`;
    const local = nyLocal(iso);
    if (local.day === day && local.time === time) return iso;
  }
  return null;
}

// "5:15 pm" or "12:00 p" to "17:15" / "12:00". Null when it is not a clock time.
export function parseClock(text: string): string | null {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m?\.?\s*$/i.exec(text);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2] ?? "0");
  if (hour < 1 || hour > 12 || minute > 59) return null;
  const h24 = (hour % 12) + (m[3]!.toLowerCase() === "p" ? 12 : 0);
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
