# Source strategy

Where listings come from, what each source may claim, what it costs, and what to build first. This merges three research reports, all checked on 2026-11-11: [deterministic sources](research/deterministic-sources.md), [AI discovery and extraction](research/ai-discovery-tools.md) and [community and ideas](research/community-and-ideas.md). Read those for evidence and URLs. Prices and counts here are point-in-time. The authors fetched the sources; the Parks robots rule and the Open Data mirror were re-checked by hand when this was written.

## Bottom line

- **Automation covers little of martial arts by itself.** Today the Parks feed has no martial arts event, and only about nine Parks recreation centers and one older-adult center run relevant classes. A winter directory is 4 to 8 honest listings plus whatever Santa's Knights confirms. Do not pad it.
- **Most of the value is in a short, well-evidenced list.** The hard part is proving "free" for each listing. Cost is not the constraint: the deterministic sources are $0, and the AI pipeline estimates $1 to $11 a month (see Cost).
- **Santa's Knights' own classes are the best listings we can get,** but their schedule is not readable from the website. The team has to supply it.

## Sources, in build order

| # | Source | Method | What it gives | Cost status it can support | Effort |
| --- | --- | --- | --- | --- | --- |
| 1 | **Parks events**, via NYC Open Data mirror `w3wp-dpdi` | Open Data JSON, daily | Dated events with location and registration text | `free` only from an event-specific quote in the description. Otherwise `unverified` | S |
| 2 | **NYC Aging older-adult center activities**, `fzy4-e84j` | Open Data JSON, weekly | 31 tai chi rows today (30 at Grand Street Settlement, 1 in Queens), 22 upcoming | `unverified`: the shared policy proves free membership, not free activity participation. Require activity-specific evidence before upgrading | S |
| 3 | **Parks recreation-center schedules**, `/facilities/recreationcenters/<code>/schedule` | Polite HTML scan, weekly, 37 pages | About 9 centers with martial arts or boxing, e.g. Karate at Pelham Fritz and Youth Boxing at Jackie Robinson, both in Harlem | Default `unverified`. Parks says martial arts "may require additional session fees". Upgrade only if the class's own text says no fee | M |
| 4 | **Curated listings** (Santa's Knights, Henry Street Jacob Riis Cornerstone, Cops & Kids, Harlem Hospital Shape Up) | A reviewed data file, refreshed by a person | The real winter inventory | From a quote captured per listing | S |
| 5 | **OpenStreetMap venues** (124 NYC martial arts features, 70 with websites) | Overpass, monthly | Locations and websites for discovery. Never listings by themselves | None. ODbL credit and share-alike apply | S |
| 6 | **Site probe** of those 70 websites | Two GETs per site, monthly | Found 1 site with `Event` data, 0 calendar feeds, 17 mentioning a free trial or class | `free_trial_only` leads | M |
| 7 | **AI extraction** of approved pages | Fetch, cleanup, one Haiku 5.5 call, quote check | Structured listings from sites with no feed | Only when the quote is found verbatim in the fetched text | M |
| 8 | **Submissions and "still free?" checks** | A form with a required URL and quote | Organizer-confirmed listings | Same quote rule | M |

Also usable as leads, not sources: Parks historical events (`fudw-fgrp`, 2013 to 2019, has a free flag) to find series worth re-checking.

**Not usable, with the reason:**
- Parks `/xml/` feed: the site's `robots.txt` disallows it for all agents. Use the Open Data mirror.
- Library calendars (Brooklyn, Queens, NYPL), Bryant Park exports, USA Fencing's club list, findhelp: blocked, disallowed or not scrapable (details in `docs/sources.md`).
- Meetup API: needs a paid Pro plan.
- Eventbrite: no usable search API. City pages are parseable but noisy and its terms are unread, so keep it off.
- Aggregators such as Mommy Poppins and CourseHorse: not scraped.

## Rules for calling something free

1. **A quote or it's `unverified`.** The quote must appear verbatim in the fetched page, and it must apply to that class, not to the organization.
2. **A price of 0 in structured data is not evidence.** One studio's events plugin marks every class, paid ones included, with `price: "0"`.
3. **"Little to no cost" is not free.** The Peter Westbrook Foundation says it, but its registration page charges $200 a season.
4. **Membership is not class access.** Parks recreation-center membership is free for under-18s, but martial arts sessions can carry fees. A Brooklyn library tai chi event did not say free either.
5. **Keep a "looks free, isn't" list.** Hidden records with the quote that shows the price save volunteers from re-checking.
6. **"Last confirmed running" is separate from cost verification.** A tap after class says the class happened, not that it's free.

## Cost

| Part | Monthly |
| --- | --- |
| Parks, Aging and rec-center adapters, OSM, site probe (plain fetches) | $0 |
| Discovery search (about 200 searches on Tavily's free tier) | $0 |
| AI extraction with Haiku 5.5 at 300, 1,000 and 3,000 pages a week, every page changed, with 20% contingency | $1.06, $3.55, $10.65 |
| Same if only 25% of pages change | $0.27, $0.89, $2.66 |

With a hard monthly spend cap reserved in Postgres before each paid call. Proposed ceiling: $15 across all metered services. A change filter (ETag, `Last-Modified`, content hash, sitemap `lastmod`) means the model only runs when a page changed. All figures assume free hosting, which depends on the open decision below. They are estimates from token arithmetic, not measured.

## Build order

1. **Parks adapter on the Open Data mirror** (S). Dedupe on `guid`, store the event link and registration link, map to `ingest_listing`. Expect zero martial arts matches now, so this proves the pipeline end to end.
2. **NYC Aging adapter** (S). The first source with current martial arts-adjacent rows.
3. **Curated listings file** (S). A reviewed file in the repo, one entry per listing with its quote, URL and capture date, loaded through the same ingest path. This needs no admin screen and no auth, and each change is a reviewable commit. This is my suggestion, not from the reports.
4. **Parks recreation-center scan** (M). Default `unverified`. Use word boundaries in keyword matching, because `MMA` matched "Filmmaking".
5. **OSM seed and site probe** (S then M). Produces a candidate list for people to approve.
6. **AI extraction pilot** (M). Twenty approved pages, measure the quote-check failure rate and the cost, then decide whether to widen it.
7. **Submission form** (M).

## Decisions needed

1. **Hosting.** Vercel Hobby is for personal, non-commercial use, and nonprofit status doesn't establish eligibility. Confirm Vercel's terms for Santa's Knights or find a nonprofit arrangement before production. A paid plan would use most of the budget.
2. **Reuse.** The Open Data datasets carry no licence field, and no Open Data terms were found. Whether we may republish Parks descriptions is open. The safe default is to link out and keep only short quotes as evidence.
3. **AI data policy.** Free tiers differ on whether inputs are used for training. We'd send only public page text, but check the provider's terms before choosing one.
4. **Santa's Knights.** Send the questions below as one list.

## Questions for the Santa's Knights team

Cost and eligibility
1. Is every class free, including the Midtown "Premium" class at $30 a week? The site says "all classes are free" next to it.
2. Which classes are running? Armored Practice, Medieval Combat Fundamentals (Brooklyn) and Midtown show "not available" but still appear with a Book Now button.
3. Is there any cost, deposit, membership or equipment charge? Does the $0 class membership need an account before attending?
4. Age and residency limits: is Women's exactly 18+? Are teens allowed in Bootcamp? What is the minimum age for Gladiator Kids?
5. Is the Veterans class open to all US veterans, and who confirms eligibility?

Schedule and places
6. What are the weekly days and times for each class, and where can a volunteer read them without the app? A plain text schedule or public calendar link would do.
7. Does Gladiator Kids exist today? Where, when and for what ages? It has no service page.
8. Is 530 West 133rd Street the only active site, or are Brooklyn (670 Lafayette Ave) and Midtown (246 West 38th) in use?
9. Do classes pause for holidays, winter weather or summer?
10. Which year's "Letters to Santa" program is current? The page says 2024.

Permissions and partners
11. May the directory quote the site's free wording and link to each class page? Who says yes?
12. Who gets the monthly "still free?" link, and who is the backup?
13. Which Partners logos are free-program partners and which are sponsors or press? Graham Windham, Combat Wounded Veterans of America, the NYPD, the Department of Veterans Services and the Dwyer Project in particular.
14. Do you know of other free martial arts, boxing, self-defense or tai chi programs in Harlem, the Bronx or Brooklyn that students already attend?
15. Would instructors use a one-tap "ran today" check, and would you keep a QR flyer at Manhattanville Community Center?

## Caveats

- **Capture quotes again before storing them.** Several quotes in the community report came through a summarizing fetch tool and are marked "excerpt". Re-capture each one verbatim from the live page before it becomes evidence.
- **Not covered:** Boys & Girls Clubs, YMCAs, Educational Alliance, Grand Street Settlement, CUNY and other universities, houses of worship, wushu groups, Mindbody, Momence and similar booking widgets, and what recreation-center registration pages charge. These are gaps, not negative findings.
- **Seasonal.** Outdoor and Parks series have ended for the year. Don't show reopen dates for 2027 until someone verifies them.
- **Counts change.** The row counts above are from 2026-11-11.
