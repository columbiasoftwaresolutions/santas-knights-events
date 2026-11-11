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
