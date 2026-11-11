# Free resources in NYC — prototype spec

Santa’s Knights needs a directory of free NYC martial arts resources. Use one Next.js app with shadcn/ui, plain React, Effect on the server and Supabase Postgres through supabase-js. Vercel hosts the app and secured ingestion cron handlers. Wix integration is outside this prototype. A hosted Supabase database (`santas-knights-db`, provisioned through Vercel) exists with the initial migration applied; it holds no listings yet.

## Directory

Search and filter by category, borough/neighborhood, age and discipline; offer list/map views and listing details with venue, schedule, eligibility, registration instructions and quoted cost evidence with a checked date. Categories and disciplines remain data. Map only known coordinates; unknown ages, schedules and locations stay unknown.

Cost statuses are `free`, `free_with_registration`, `free_trial_only`, `sliding_scale` and `unverified`. Default results include the first two; other statuses require explicit selection and distinct labels. Required membership, equipment charges, residency and trial limits belong in eligibility/registration notes. Missing or conflicting cost information means `unverified`. A public venue or the word “community” does not establish free access.

A free listing, including a hidden one, requires evidence supporting its exact cost status and `last_verified_at`. Evidence records the applicable quote, HTTP(S) URL, source, actual capture/check time and method. The database checks existence, not truth or relevance; adapters must validate those. Preserve historical evidence. Repeatedly seeing an unchanged record advances `last_seen_at`, not cost verification.

Public visibility is simply `status = active`. Adapters explicitly send `active` for validated offerings; otherwise the default is `hidden`. There is no approval gate. Keep `discovered_by` as provenance. Public clients use RLS; privileged reads must also filter for active rows.

## Sources and demo

Start with one Parks JSON adapter and individually checked curated offerings. See [sources](sources.md) for research and access limitations: library parsers remain unverified, NYC Open Data is historical discovery until currency is established, and Bryant Park’s verified 2026 seasons have ended. Do not invent winter listings, assume center-level martial arts schedules or carry summer sessions forward. Honest empty results are acceptable.

The demo needs one real import, an idempotent repeat, current curated records where verified, search/filter/map behavior, evidence on every free result and private ingestion-run counts/errors. The migration seeds taxonomy only.

## Storage and ingestion

Keep sources, listings, occurrences, evidence, ingestion runs and taxonomy tables. Deduplicate listings by `(source_id, dedupe_key)` using stable source IDs, not mutable titles/dates. Cross-source merging is manual. A listing has zero or more source-confirmed dated occurrences, plus source schedule text; there is no recurrence engine. Store instants as `timestamptz`, display/filter in `America/New_York`, and allow unknown end times.

The service-role-only `ingest_listing` RPC atomically upserts a full listing snapshot, upserts supplied occurrences and inserts evidence while skipping exact duplicates. It preserves omitted occurrences; cancellation must be explicit. Only newly inserted matching evidence can advance verification. See [the architecture contract](effect-architecture.md) for payload details. Runs use plain service-role inserts/updates. Reconcile missing occurrences only after a complete successful snapshot of the same source window.

The TypeScript `Listing` model in `src/lib/listings/schema.ts` already supports nullable discipline, borough, neighborhood, venue, coordinates, schedule, ages, eligibility, registration details and evidence. Free statuses still require matching evidence. Project each occurrence with the shared listing `id` and a unique `sessionId`; use `sessionId` as the UI key. Undated listings may have null day/start/end times. Preserve unknown values rather than fabricating dates, locations or eligibility. The database adapter must project into and decode this existing model.

## Deferred

- Review workflow and approval states.
- Freshness policy and automatic stale marking.
- AI discovery (`discovered_by` remains available).
- Admin UI.

Also outside the prototype: accounts, payments/booking, broad scraping, automatic geocoding, hosted setup and guaranteed citywide coverage.
