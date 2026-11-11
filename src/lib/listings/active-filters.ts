import { shortDate } from "@/lib/dates";

import { COST_LABEL, type Filters } from "./schema";

export interface ActiveFilter {
  key: keyof Filters;
  label: string;
}

// The filters a visitor has set, in plain words. Drives the mobile summary and the
// empty-state "remove" links. The default (free only) is not a filter they set.
export function activeFilters(filters: Filters): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (filters.q) out.push({ key: "q", label: `“${filters.q}”` });
  if (filters.cost) {
    out.push({
      key: "cost",
      label: filters.cost === "any" ? "Any cost" : COST_LABEL[filters.cost],
    });
  }
  if (filters.borough) out.push({ key: "borough", label: filters.borough });
  if (filters.discipline) out.push({ key: "discipline", label: filters.discipline });
  if (filters.day) out.push({ key: "day", label: shortDate(filters.day) });
  return out;
}

export const DEFAULT_SCOPE = "All free sessions";

export function filterSummary(filters: Filters): string {
  const active = activeFilters(filters);
  return active.length === 0 ? DEFAULT_SCOPE : active.map((a) => a.label).join(", ");
}
