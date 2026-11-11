export const NYC_TZ = "America/New_York";

// YYYY-MM-DD for the given instant, as seen in New York.
export function nycDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NYC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// UTC offset (e.g. "-05:00") that New York observes at the given instant.
function nycOffset(date: Date): string {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: NYC_TZ,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value;
  return part?.replace("GMT", "") || "-05:00";
}

// ISO timestamp for `time` (HH:mm) in New York, `dayOffset` days from today.
export function nycIsoFromToday(dayOffset: number, time: string): string {
  const day = new Date(Date.now() + dayOffset * 86_400_000);
  const dateKey = nycDateKey(day);
  return `${dateKey}T${time}:00${nycOffset(day)}`;
}

export function formatEventDate(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const day = start.toLocaleDateString("en-US", {
    timeZone: NYC_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      timeZone: NYC_TZ,
      hour: "numeric",
      minute: "2-digit",
    });
  return endsAt
    ? `${day}, ${time(start)} – ${time(new Date(endsAt))}`
    : `${day}, ${time(start)}`;
}

export function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: NYC_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  });
}
