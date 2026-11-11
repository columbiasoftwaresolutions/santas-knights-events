import { nycDateKey } from "./dates";
import { SAMPLE_EVENTS } from "./sample-events";
import {
  BOROUGHS,
  CATEGORIES,
  type Borough,
  type Category,
  type EventFilters,
  type NycEvent,
} from "./types";

// Data-access layer. Every page reads events through these functions, so
// swapping sample data for Supabase only means changing this file: replace
// the bodies with Supabase queries and map rows to `NycEvent`.

export async function getEvents(filters: EventFilters = {}): Promise<NycEvent[]> {
  const q = filters.q?.trim().toLowerCase();

  return SAMPLE_EVENTS.filter((e) => {
    if (filters.category && e.category !== filters.category) return false;
    if (filters.borough && e.location.borough !== filters.borough) return false;

    const day = nycDateKey(new Date(e.startsAt));
    if (filters.from && day < filters.from) return false;
    if (filters.to && day > filters.to) return false;

    if (q) {
      const haystack = [
        e.title,
        e.description,
        e.location.venueName,
        e.location.neighborhood ?? "",
        e.source.name,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getEventById(id: string): Promise<NycEvent | null> {
  return SAMPLE_EVENTS.find((e) => e.id === id) ?? null;
}

// Turns raw URL search params into validated filters.
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): EventFilters {
  const str = (key: string) => {
    const v = params[key];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const date = (key: string) => {
    const v = str(key);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
  };
  const category = str("category");
  const borough = str("borough");

  return {
    q: str("q"),
    category: CATEGORIES.includes(category as Category)
      ? (category as Category)
      : undefined,
    borough: BOROUGHS.includes(borough as Borough)
      ? (borough as Borough)
      : undefined,
    from: date("from"),
    to: date("to"),
  };
}
