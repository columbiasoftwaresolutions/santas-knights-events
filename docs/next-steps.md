# Directory prototype: next steps and caveats

Updated 2026-11-11. This is a deployed prototype, not a complete citywide directory.
Live: https://santas-knights-events-nine.vercel.app. Supabase is the production data source; no implicit sample fallback runs in production.

## Start here

1. **Complete the remaining named review.** Astra completed the full visual/code/test audit of `4d948dc`; its recovered report is [saved here](reviews/astra-2026-11-11.md). Opus 5.5 failed immediately with “Claude API rate limit reached.” The reported reset was November 11 at 4:30pm America/New_York (21:30 UTC). No Opus report exists and no reviewer is still running. Request one new combined visual/code/test review from Opus 5.5 after availability returns. Do not substitute models or pay for a duplicate Astra review. Neither named model has reviewed the fixes made after `4d948dc`.
2. **Confirm real schedules and costs with the partners.** Use the questions in [source strategy](source-strategy.md#questions-for-the-santas-knights-team). Get dated Santa’s Knights sessions, ages, venues, registration/account/equipment requirements, holiday exceptions, and a maintenance contact. Resolve the contradictory Midtown premium fee before listing it as free. Confirm Henry Street visit instructions and missing curated addresses. Aging activities now remain unverified: free membership is not evidence of free classes.
3. **Fix session lifecycle before unattended expansion.** Add stable source IDs where available and explicit complete-snapshot metadata where they are not. Reconcile only complete scans of the same bounded window. Add a safe read-model distinction between never scheduled and all cancelled. Test rescheduling, cancellation and partial scans under public RLS before applying a migration.
4. **Assign operations ownership.** Someone must inspect failed/partial cron runs, recheck evidence, retire removed programs manually, and confirm hosting/reuse arrangements for ongoing organizational use. Keep using the existing Vercel/Supabase projects; no new paid service or API key is approved by this document.
5. **Choose the next product increment.** Age/category/neighborhood facets and clearer grouped program dates are the most useful additions. Map/detail pages, submissions and AI discovery remain deferred. The scope below is the prototype acceptance boundary, not a claim that the original specification is fully delivered.

## Implemented scope

- One Next.js/shadcn/Effect/Supabase application; pnpm, existing dependency versions and Vitest retained.
- Search across listing text/location/discipline; cost, borough, discipline and day filters; seven-day strip; responsive filter disclosure; linked quoted evidence and registration destinations.
- Anonymous reads use the public key and RLS. Service-role ingestion is behind a timing-safe bearer check. RPC writes preserve per-listing atomic evidence constraints.
- Four adapters and four Vercel cron schedules. Curated/Parks events run daily; Aging/rec-center schedules run Mondays. Times in `vercel.json` are UTC. Do not run all adapters just to inspect the app.
- The earlier populated inventory was 6 curated listings, 2 Aging activities and 37 unverified rec-center listings; Parks scanned 575 events with no relevant matches. These are historical counts, not assertions about future source contents.
- Address, undated schedule context and descriptions now reach the listing UI. Dated session counts are separate from programs whose schedules need confirmation. Narrow layouts stack the time above the title; the sidebar starts at the large breakpoint.

## Review disposition

Astra’s original report is preserved unchanged except for the archival introduction. The table records this continuation’s response; “fixed” does not imply an independent re-review.

| Finding | Disposition |
| --- | --- |
| Parks incidental “free”, trials or conflicting charges promoted to free | Fixed conservatively. Require a narrow affirmative participation sentence; charge/trial/negation/conditional language stays unverified. HTML is normalized first. This favors false negatives over unsupported free claims; trial extraction remains deferred. |
| Aging free membership treated as activity evidence | Fixed: all Aging activities remain unverified until applicable activity evidence is obtained. Membership-policy fetch is no longer used to promote cost. Both existing hosted Aging rows were downgraded during this release; no other production records were changed. |
| Rescheduling creates duplicate sessions | Parks now uses GUID as occurrence identity rather than GUID plus time. Existing legacy keys are not automatically rewritten. Aging and rec-center feeds lack a demonstrated immutable session ID; bounded snapshot reconciliation remains deferred. Do not dedupe by title/time alone. |
| All-cancelled listings return as undated | Deferred database/read-model work. Public RLS hides cancelled occurrences, so a zero-row relation cannot distinguish cancellation from an undated program. No policy was weakened. A staff member must hide a fully cancelled listing until the read-model fix exists. |
| Partial rec-center fetch looks successful | Fixed: unreadable/refused pages set incomplete metadata; retained writes produce partial/failed run status. Non-success summaries return HTTP 503. Index failure fails collection. No absence reconciliation runs. |
| Run lookup failure leaves run running; raw errors exposed | Fixed for recoverable lookup and collection failures: finish the run and return stable error codes. Database/upstream error text is not returned by cron. A database outage during finalization or process termination can still leave a running row. |
| Scan/cancellation deadline | Rec-center collection now has a 240-second budget with requests bounded by the remaining time. The route allows 300 seconds. Full Effect interruption propagation, cancellable delay/body handling across every source, and a total database-write/finalization budget remain deferred. |
| Impossible day parameters crash | Fixed with a shared non-throwing calendar predicate, including impossible months and leap days. Invalid filters are ignored. |
| Feed rows cast without validation | Fixed at the external row boundary; malformed rows are rejected individually and counted. Parks text is normalized. Expand the trimmed fixtures when source schemas change. |
| Address/schedule/description dropped | Fixed through projection/domain/UI; description and schedule context display for undated programs. |
| Mobile time/title collision | Fixed by stacking below the small breakpoint. Tablet keeps the filter disclosure until the large breakpoint. |
| Undated programs counted as weekly sessions | Fixed with separate counts and a jump link to undated programs. |
| Misleading destination labels; repeated Register names | Fixed: class-details/source-dataset labels, plus listing-specific accessible text. Dataset links still are not enrollment journeys; provider contact data is needed. |
| Input boundary contrast | Darkened the input-border token; preserve the existing ink/paper/brick/gold/green design. |
| Missing skip/search landmarks; uncertainty copy | Added a skip-to-results link and semantic search landmark. Unverified copy now mentions possible membership/session fees. A compact mobile week-mark legend and availability-specific treatment remain deferred. |
| Repeated eligibility and evidence across sessions | Grouped program/date presentation deferred. Keep quoted evidence visible; do not silently collapse it away. |
| Capped/unordered read and growing evidence history | Deferred deterministic pagination, SQL window/filter queries and newest-evidence selection. Current read caps at 2,000 listings; hosted PostgREST may enforce a lower cap. Aging caps at 5,000 oldest-first feed rows; Parks at 2,000. A cap hit can omit records silently. Do not expand inventory without fixing completeness detection/pagination. |
| Documentation and curated provenance drift | README, architecture and source strategy updated. Runner now passes curated provenance to RPC. Earlier stored provenance needs a reviewed curated re-ingest if historical correction is required. |
| Server-only guard / managed runtime | Deferred explicit module poisoning/shared runtime. There are no client imports of credential modules; keep that boundary. Do not add a dependency or restructure the runtime without a concrete need and approval for dependency changes. |
| Test audit | Removed remaining query/key-order and synthetic-ID spelling assertions; HTTP retry tests use fake timers; curated behavior fixtures are purpose-built; database failures assert SQLSTATE. Added regression tests at the affected layers. Some fixture tests still select the only/relevant parsed entry by position; rewrite if the fixture expands. |

## Data rules and unresolved source questions

**No quote means no free claim.** A quote must apply to participation in that class. Venue presence, free membership, price-zero metadata and incidental freebies do not qualify. Curated quotes are checked on each ingestion; a missing quote/page downgrades the listing. The parser cannot replace human review of contextual price contradictions.

**Disappearance is not cancellation.** Listings do not automatically go stale or hidden when a program disappears. The runner does not reconcile missing occurrences, even on nominal success. Partial scans, refusal, truncation and outages are not proof of cancellation. Removed undated curated entries can remain active indefinitely; maintainers must review/hide them manually. Previously misclassified production rows were deleted in the earlier thread, not by this continuation.

**Known source limits:** Parks recreation-center schedules always remain unverified because martial arts can have session fees. Only title matches establish martial-arts relevance. Parks `/xml/` remains disallowed; use the Open Data mirror. Older-adult center coverage is incomplete and primarily 60+ tai chi. Repeated-looking boxing programs may represent separate source program IDs; inspect the source before merging them. Curated addresses/eligibility and ongoing schedule confirmation still need partner input. Henry Street’s quote verified from Vercel previously but local Node fetches failed; verification may differ by execution environment.

**Discovery is not built.** OSM/site probing, the 20-approved-page AI extraction pilot, spend reservation/caps, API keys, review/admin screens, submissions, “still free?” messaging, geocoding and cross-source deduplication are deferred. OSM venue data is a discovery lead, never class/free evidence. Any AI pilot needs explicit provider/data-policy/budget choices first. No metered services were added.

**Product scope still deferred:** age/category/neighborhood facets, a map, listing detail routes, grouped session presentation, submissions, multilingual support and organizer workflows. Ages remain source text, not an inferred all-ages promise.

## Operations and release checks

Use the already linked Vercel personal team `jeetsh4hs-projects`, project `santas-knights-events`, and hosted Supabase `santas-knights-db` in US East. Credentials remain only in ignored local/deployment configuration. Never print environment values or put them in review prompts. `20261111000000_init.sql` is already applied; do not edit that migration to alter the hosted database.

Before release, run `pnpm check` (lint, formatting, types, Effect diagnostics, tests) and `pnpm build`. Commit logical changes, rename the local branch to `directory-prototype`, push only that branch with upstream, and deploy via the existing Vercel CLI configuration. A branch push creates a GitHub-linked preview; production is separately promoted by CLI. No PR or main/backup-branch push is requested.

Check the public homepage, default/borough/discipline/unverified/empty/invalid-day views and mobile/tablet/desktop layout. An unauthenticated cron request must return 401. Inspect deployment readiness. Use public-key Supabase reads to confirm anonymous inventory. Only run authenticated ingestion when a data correction is needed; for this release the Aging cost downgrade is necessary. Verify that no Aging listing remains in the default free scope afterward.

Cron failures are 503 for partial/failed summaries and 500 for infrastructure failure; inspect `ingestion_runs` for the stable code and counts. A hard stop can still leave `running`; stale runs older than ten minutes are closed on the next attempt. Failure during that recovery or finalization requires operator inspection. Retries must not assume an incomplete scan is a full snapshot.

Existing checks cover database grants/RLS and evidence rollback using PGlite, not hosted PostgREST pagination or concurrent transactions. No physical-device, screen-reader speech, forced-colors, actual registration checkout or live concurrent-database audit is claimed. Astra did not inspect source pages or hosted grants and did not write production data. Do not describe this release as approved by both named reviewers.

Vercel Hobby was accepted for this prototype; ongoing organizational/commercial eligibility and content reuse/attribution still need an owner to confirm. The earlier research recorded uncertainty about source reuse terms. Retain short applicable quotes and links; do not interpret public availability as blanket republication permission. Budget/source research is dated November 11, not a current price or legal guarantee.

## Validation recorded for this continuation

- `pnpm check`: passed, 178 tests across 17 files; no lint/type/format/Effect errors.
- `pnpm build`: passed with the normal Turbopack configuration after moving generated build output out of the way. Two initial attempts hit a cached sandbox port-binding failure. A webpack fallback compiled but omitted this project’s Turbopack-only Tailwind processing; it was rejected as a release/visual check. No build configuration or dependencies were changed.
- Production deployment `dpl_FXXfmFkJ4KoPR4XEf9xYKeaddXtD`: READY, alias https://santas-knights-events-nine.vercel.app. Released app code through `970b58f`; later commits only document the handoff. The CLI deployment preceded the branch rename, so its metadata can retain the earlier local branch name.
- Browser checks on the styled local production build at 390/768/1280px found no horizontal page overflow; all 28 displayed unverified rows had no mobile time/title overlap. The tablet retained the filter disclosure and desktop showed the sidebar.
- Live default, Manhattan, Boxing, no-match search, free-trial empty state, unverified and invalid-calendar-date views loaded successfully. Addresses render and cron without credentials returns 401. Default results after correction: **0 dated free sessions this week and 5 free programs with schedules to confirm**. This is an honest coverage limit; obtain schedules rather than inventing occurrences.
- Only the two unsupported Aging free claims were changed in hosted data. No fresh source scan, schema migration, service, API key or paid dependency was added. Local temporary server was used only for checks and stopped afterward.
- Remaining review blocker: Opus 5.5’s original invocation failed before producing findings. Its reported reset has not yet arrived during this continuation; no replacement model or duplicate Astra invocation was started. Work after the Astra-reviewed base still needs the named Opus review.
