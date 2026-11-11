# Free martial arts in NYC

Prototype directory of free martial arts classes, open mats and events in New York City.
Each listing carries a cost status and the quoted source text that backs it up.

Stack: Next.js, shadcn/ui, Effect (server and data layer), Supabase, Vercel. One app, pnpm.

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build
```

## Where things are

- `src/server/listing-repo.ts`: the `ListingRepo` Effect service. The sample layer is swapped for a Supabase layer later.
- `src/lib/listings/`: domain schema (Effect Schema), URL filter parsing and the invented sample data.
- `src/app/globals.css`: the shadcn theme tokens (paper, brick red, gold, green; 2px radius).
- `docs/` and `supabase/`: spec, source registry and schema (in progress).

The listings shown are invented sample data. Every real listing links to its official page, and to a registration page when there is one (`src/lib/listings/links.ts`). Source URLs are untrusted, so only `http(s)` links without credentials are accepted (`src/lib/listings/url.ts`).

## Data and deployment

The directory reads Supabase with the public key. Listings arrive through `/api/cron/ingest?source=<slug>`, which
needs `Authorization: Bearer $CRON_SECRET` and writes with the service role key through the `ingest_listing` function.
Vercel Cron (`vercel.json`) runs each source on its own schedule:

| Source (`slug`)     | What it reads                                         | Runs    | Free status it can give                           |
| ------------------- | ----------------------------------------------------- | ------- | ------------------------------------------------- |
| `curated`           | Reviewed listings in `ingest/sources/curated.ts`      | daily   | From a quote re-checked on the live page each run |
| `parks-events`      | NYC Parks events via NYC Open Data (`w3wp-dpdi`)      | daily   | Only from an event sentence that says free        |
| `nyc-aging-oac`     | NYC Aging older adult center activities (`fzy4-e84j`) | Mondays | Free with membership, quote re-checked each run   |
| `parks-rec-centers` | Parks recreation-center schedule pages                | Mondays | Never. Parks says martial arts may carry fees     |

A deployed app never shows invented data. If Supabase is empty the page says so, and if it is unreachable an error
page shows. `LISTINGS_SOURCE=sample`, or running locally without Supabase settings, uses the demo data.
See `docs/source-strategy.md` for why these sources, and `.env.example` for the settings.

## Code quality

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `pnpm lint`         | oxlint (correctness errors, suspicious and perf warnings) |
| `pnpm format`       | oxfmt, which also sorts imports and Tailwind classes      |
| `pnpm typecheck`    | `next typegen` then `tsc --noEmit`                        |
| `pnpm effect:check` | Effect language-service diagnostics                       |
| `pnpm test`         | Vitest                                                    |
| `pnpm check`        | all of the above. CI runs them too, then `pnpm build`     |

A pre-commit hook runs oxlint and oxfmt on staged files, and a pre-push hook runs the type-check and tests.
`src/components/ui` holds shadcn components and is skipped by lint and format. Some of them carry this project's design choices (for example the button and input defaults), so check the diff before regenerating one.
Lint also runs `@shadcn/lint` design-system rules, and `react/jsx-no-target-blank` for outbound links.
In VS Code, accept the prompt to use the workspace TypeScript so the Effect plugin loads.
