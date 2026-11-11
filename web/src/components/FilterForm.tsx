import Link from "next/link";
import { BOROUGHS, CATEGORIES, type EventFilters } from "@/lib/types";

const inputClass =
  "bg-card border border-line-strong rounded px-2 py-1 w-full focus:outline-2 focus:outline-gold";

export default function FilterForm({ filters }: { filters: EventFilters }) {
  return (
    <form
      method="get"
      className="bg-paper-raised border border-line rounded p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end"
    >
      <label className="lg:col-span-2 flex flex-col gap-1 text-sm text-muted">
        Search
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Title, venue, neighborhood…"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Category
        <select name="category" defaultValue={filters.category ?? ""} className={inputClass}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Borough
        <select name="borough" defaultValue={filters.borough ?? ""} className={inputClass}>
          <option value="">All boroughs</option>
          {BOROUGHS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        From
        <input type="date" name="from" defaultValue={filters.from} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        To
        <input type="date" name="to" defaultValue={filters.to} className={inputClass} />
      </label>

      <div className="flex gap-3 items-center sm:col-span-2 lg:col-span-6">
        <button
          type="submit"
          className="bg-red hover:bg-red-deep text-white font-semibold rounded px-4 py-1.5"
        >
          Apply
        </button>
        <Link href="/" className="text-sm text-muted underline hover:text-ink">
          Clear filters
        </Link>
      </div>
    </form>
  );
}
