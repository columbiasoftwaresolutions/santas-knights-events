# santas-knights-events

A directory of free NYC events and resources, collected from official sources.

## Structure

- `web/` — Next.js + TypeScript frontend (currently backed by sample data)

## Running the frontend

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

## Replacing sample data

All pages read events through `web/src/lib/events.ts` (`getEvents`, `getEventById`).
To switch to the real database, replace those function bodies with database queries
and map rows to the `NycEvent` type in `web/src/lib/types.ts`. Nothing else needs to change.
