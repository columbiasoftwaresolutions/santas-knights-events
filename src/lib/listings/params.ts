import { BOROUGHS, COST_STATUSES, type Borough, type CostStatus, type Filters } from "./schema";

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function parseFilters(params: Params): Filters {
  const borough = first(params.borough);
  const cost = first(params.cost);
  const day = first(params.day);
  return {
    q: first(params.q),
    borough: BOROUGHS.includes(borough as Borough) ? (borough as Borough) : undefined,
    discipline: first(params.discipline),
    cost: COST_STATUSES.includes(cost as CostStatus) ? (cost as CostStatus) : undefined,
    day: day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined,
  };
}

// Link that sets one filter, or clears it when it is already set to that value.
// An empty value clears the filter, which is how "All free sessions" is selected.
export function toggleHref(filters: Filters, key: keyof Filters, value: string): string {
  const next: Record<string, string | undefined> = { ...filters };
  next[key] = value === "" || next[key] === value ? undefined : value;
  return hrefFor(next);
}

export function hrefFor(values: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}
