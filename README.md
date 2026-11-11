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

The listings shown are invented sample data.
