import Link from "next/link";

import { toggleHref } from "@/lib/listings/params";
import type { CostStatus, Filters } from "@/lib/listings/schema";

export interface Facet {
  key: keyof Filters;
  title: string;
  // An option with value "" is the default view. It is shown as selected when no
  // filter is set, and selecting it clears the filter.
  options: { value: string; label: string; count: number; status?: CostStatus }[];
}

// idPrefix keeps element ids unique when the column is rendered twice (phone and desktop).
export function FilterColumn({
  facets,
  filters,
  idPrefix,
}: {
  facets: Facet[];
  filters: Filters;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-7">
      {facets.map((f) => (
        <section key={f.key} aria-labelledby={`${idPrefix}-${f.key}`}>
          <h2 id={`${idPrefix}-${f.key}`} className="font-heading text-base font-bold">
            {f.title}
          </h2>
          <ul className="mt-2 border-t-2 border-ink">
            {f.options.map((o) => {
              const on = (filters[f.key] ?? "") === o.value;
              return (
                <li key={o.value} className="border-b border-rule">
                  <Link
                    href={toggleHref(filters, f.key, o.value)}
                    aria-current={on ? "true" : undefined}
                    className="flex items-baseline justify-between gap-3 py-1.5 text-sm hover:text-primary"
                  >
                    <span className={`flex items-center gap-2 ${on ? "font-bold" : ""}`}>
                      {o.status ? (
                        <span className="mark" data-status={o.status} aria-hidden="true" />
                      ) : (
                        on && <span className="size-2 bg-primary" aria-hidden="true" />
                      )}
                      {o.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{o.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
