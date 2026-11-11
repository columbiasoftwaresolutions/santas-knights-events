import Link from "next/link";
import { toggleHref } from "@/lib/listings/params";
import type { Filters } from "@/lib/listings/schema";

export interface Facet {
  key: keyof Filters;
  title: string;
  options: { value: string; label: string; count: number }[];
}

export function FilterColumn({ facets, filters }: { facets: Facet[]; filters: Filters }) {
  return (
    <div className="flex flex-col gap-7">
      {facets.map((f) => (
        <section key={f.key} aria-labelledby={`f-${f.key}`}>
          <h2 id={`f-${f.key}`} className="font-heading text-base font-bold">
            {f.title}
          </h2>
          <ul className="mt-2 border-t-2 border-ink">
            {f.options.map((o) => {
              const on = filters[f.key] === o.value;
              return (
                <li key={o.value} className="border-b border-rule">
                  <Link
                    href={toggleHref(filters, f.key, o.value)}
                    aria-current={on ? "true" : undefined}
                    className="flex items-baseline justify-between gap-3 py-1.5 text-sm hover:text-primary"
                  >
                    <span className={on ? "font-bold" : ""}>
                      {on && <span className="mr-2 inline-block h-2 w-2 bg-primary" aria-hidden="true" />}
                      {o.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{o.count}</span>
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
