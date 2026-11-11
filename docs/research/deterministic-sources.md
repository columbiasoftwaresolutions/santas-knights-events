# Deterministic (non-AI) sources for free NYC martial arts

Checked **2026-11-11** with plain `curl` GETs and Python standard-library HTTP. No credentials, cookies, API keys or app tokens were used. Nothing was installed and no accounts were created. Every probe used an ordinary browser user agent. The one exception is the OpenStreetMap Overpass and Wikidata calls, which used the generic agent `nyc-free-classes-research/0.1 (curl)` after Overpass returned HTTP 406 to the browser agent. Robots files were read before crawling any site more deeply than its homepage. Raw downloads stayed in the session scratchpad and are not committed.

Labels used below:

- **VERIFIED**: I fetched this today and describe what came back.
- **UNVERIFIED**: a lead, or a claim I did not establish.

Counts are point-in-time results from 2026-11-11. None of this is a listing to publish. The brief named sources that were already researched (the Parks `/xml/` feed's martial arts match rate, the BPL, Queens and NYPL calendars, the Bryant Park ICS export). I did not re-research them, with one exception in §4: I found a robots rule that affects the Parks feed.

## 0. Headline findings

1. **VERIFIED: `robots.txt` on nycgovparks.org disallows the `/xml/` path for all user agents.** The current feed (`/xml/events_300_rss.json`) sits under that path. NYC Open Data publishes the same feed as dataset **`w3wp-dpdi`** ("NYC Parks Public Events – Upcoming 14 Days"). It has the same 16 fields and the same 575 rows today, and it updates daily through the Socrata API, which robots does not block. The Parks adapter should switch to it. See §4.
2. **VERIFIED: NYC Parks recreation-center schedule pages** (`/facilities/recreationcenters/<code>/schedule`) are server-rendered HTML with one block per program: title, room, description, instructor, intensity, ages and registration text. A polite scan of all 37 centers found martial arts or combat titles at about 9 centers. These include **Karate at Pelham Fritz (Harlem)** and **Youth Boxing Fitness at Jackie Robinson (Harlem)**. Parks also states that "martial arts … may require additional session fees", so these rows default to `unverified`.
3. **VERIFIED: NYC Aging "Older Adult Center (OAC) Activities"** (Open Data `fzy4-e84j`) is a current, dated activity feed (1,525 rows, last updated 2026-11-02). It contains 31 tai chi rows today. NYC Aging's page gives a program-wide free quote: "Older adult center membership is free and open to all New Yorkers, ages 60 and older."
4. **VERIFIED: OpenStreetMap** gives a free location backbone: 124 NYC martial arts and combat-sport features, 70 with websites. Probing those homepages found almost no machine-readable class feeds. One WordPress site emits schema.org `Event` objects with `price: "0"` on **every** class, paid ones included. **`offers.price = 0` in JSON-LD is not free evidence.**
5. **VERIFIED: event platforms and governing bodies are weak.** Eventbrite's search API returns 404. Meetup's API requires Meetup Pro. The USA Fencing member club list is disallowed for all agents in robots. The USA Judo, USA Taekwondo and USA Fencing club-finder paths I tried returned 404, and USA Boxing's club search is a JavaScript form.

## 1. Ranked source table

Effort: S is under a day, M is 1–3 days, L is more than that. "MA rows" means martial arts, combat sports, tai chi/qigong or self-defense rows.

| # | Name | URL / endpoint | Format | Auth / cost | Update | Yields | How to verify "free" | Licence / terms / robots | MA rows (est.) | Effort | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | NYC Parks recreation-center schedules | `https://www.nycgovparks.org/facilities/recreationcenters` (index of 37 centers), then `…/recreationcenters/<code>/schedule` | HTML (server-rendered, weekly grid) | None, $0 | Weekly grid, seasonal programs | `program_<id>`, title, room, description, instructor, intensity, `Ages:`, registration text (`Registration is closed.` / `Registration not required.`), weekday + date headers (`Monday<br/>11/9`), times (`12:00 p - 1:00 p`) | Membership page quote: "Youth under 18 Access to All Centers **Free membership!** Instructor-led courses like aerobics, **martial arts**, music or yoga **may require additional session fees**." Membership is free only for under-18s, and session fees are possible, so the default is `unverified`. Mark a row `free_with_registration` only if its own text or registration page states no fee | Robots allows `/facilities/…/schedule` for `*` (the only `facilities` disallow is `/sub_your_park/park_page/facilitiesPage.php?`). Reuse terms for page text are not established | **VERIFIED scan today:** 32 of 37 centers returned parseable program blocks (2,519 occurrences). MA titles found: McCarren "Mc Perfect Punch Boxing"; Red Hook "Humble Boxing /Fitness"; St. John's "Striking: Boxing and Kickboxing"; Brownsville "Tai Chi"; Jackie Robinson "Adult Boxing Fitness", "Youth Boxing fitness"; Hamilton Fish "Tai Chi"; Pelham Fritz "Karate"; Gertrude Ederle "Boxing 101"; Chelsea "Chelsea Cardio Kickboxing"; Al Oerter "Kid's Karate". About 30 weekly occurrences (my regex's `MMA` also matched "Filmmaking"; drop that pattern) | M | **VERIFIED** |
| 2 | NYC Aging — Older Adult Center (OAC) Activities | `https://data.cityofnewyork.us/resource/fzy4-e84j.json` | Socrata JSON / CSV | None. An app token is optional and free | Dataset says "Monthly … updated on an ad-hoc basis by the Providers"; rows last updated 2026-11-02 (`Last-Modified` header) | `dfta_id`, `providername`, `eventname`, `eventtype`, `description`, `eventlocation`, zip, borough, `starttime`/`endtime` (floating, no TZ), `isrecurring`, `isvirtual`, accessibility, lat/long | Program-wide quote on nyc.gov/site/dfta/services/older-adult-center.page: "Older adult center membership is free and open to all New Yorkers, ages 60 and older." Suggested status `free_with_registration` with eligibility "60+, OAC membership". No per-activity cost field exists | Dataset metadata `license: null`. Open Data–specific terms not found (see §5) | **VERIFIED:** 31 rows match tai chi/qigong/martial/self-defense/karate/boxing/kung fu. 30 are Grand St Settlement (175 Delancey St, "Tai Chi Advanced"/"Tai Chi for Beginners") and 1 is Selfhelp Austin St, Queens ("TAI CHI"). 22 start on or after 2026-11-11. Coverage is thin: only 15 distinct `dfta_id`s report, against "more than 300" OACs | S | **VERIFIED** |
| 3 | NYC Parks Public Events – Upcoming 14 Days (Open Data mirror of the Parks feed) | `https://data.cityofnewyork.us/resource/w3wp-dpdi.json` | Socrata JSON | None | Daily (metadata "Automation: Yes, Update Frequency: Daily"); rows updated today | `title, instructor, guid, link, description, registration_url, registration_description, parkids, parknames, starttime, endtime, contact_phone, location, categories, coordinates, image` | Event-level quote from `description` / `registration_description`. 68 of 575 rows contain "free" in the description today | Served by Socrata, not robots-blocked `/xml/`. Dataset `license: null` | **VERIFIED:** 0 title matches for MA keywords in the window 2026-11-11 to 2026-11-25. 225 rows are "Shape Up NYC" fitness classes (none martial today). Seasonal | S (swap transport) | **VERIFIED** |
| 4 | OpenStreetMap via Overpass | `POST https://overpass-api.de/api/interpreter` with an `area["wikidata"="Q60"]` query on `sport~martial_arts\|karate\|judo\|taekwondo\|boxing\|…` | JSON | None. Fair-use public instance | OSM is continuous. Run monthly | name, `sport`, `website` (70), `phone` (76), `addr:*` (67), `opening_hours` (14), coordinates | None. Only one feature has a `fee` tag (`fee=yes`). OSM is location and discovery only, never free evidence | **VERIFIED** licence: ODbL ("free to copy, distribute … as long as you credit OpenStreetMap and its contributors … share-alike"). Overpass gave 406 to a browser user agent and 200 to an identifying one | **VERIFIED:** 124 elements (osm_base 2026-11-11T18:45Z). Top sports: taekwondo 27, boxing 20, kickboxing 16, karate 16, martial_arts 15, jiu-jitsu 12 | S | **VERIFIED** |
| 5 | Homepage structured-data probe of OSM websites | Each `website` tag → `robots.txt` → homepage | HTML / JSON-LD / platform fingerprints | None | Monthly | `@type`s, CMS/booking-platform fingerprint, free-phrase hits | Only a page-specific text quote. **JSON-LD `offers.price` is not trustworthy** (see #5a) | Per-site robots (none of the 70 disallowed `/` for `*`) | **VERIFIED** on 70 sites: 58 OK, 12 errors (dead DNS, 404 subpages). Platforms: WordPress 22, Squarespace 8, Wix 6, Gymdesk 3, GoDaddy 3, Spark 2, Momence 2, Pike13, ClubReady, Mindbody, Weebly 1 each. JSON-LD types were mostly `WebSite`/`Organization`/`LocalBusiness`. **1 site with `Event`**. 17 sites mention "free trial"/"free class" (mostly `free_trial_only` leads). No `.ics`/webcal/Google Calendar links found | M | **VERIFIED** |
| 5a | Zero G BJJ (Brooklyn) — WordPress + Modern Events Calendar JSON-LD | `https://zerogbjj.com` (102 `Event` objects); `/wp-json/` lists `mec/v1` | JSON-LD `Event` | None | Rolling | startDate/endDate with offset, Place + address, organizer, `offers.url` (class permalink) | **Trap:** every Event has `"price": "0"`, including normal membership classes, so the plugin default must not be read as free. The visible schedule text includes "Women's Free Open mats", which is an event-level quote candidate | Robots not restrictive. Terms not checked | 102 class occurrences, about 15 whose JSON mentions "free" | S per site | **VERIFIED** (structure). Free status **UNVERIFIED** |
| 6 | Squarespace `?format=json` | e.g. `https://www.happykicks.com/?format=json` (World Martial Arts Center), `https://palnyc.org/sports-and-recreation?format=json` | JSON (page and collection model) | None | On change | `collection.typeName`, `mainContent` HTML, `items`/`upcoming` for event collections | Text quote from `mainContent` or an event item | Squarespace robots (checked on two sites) disallows `/api/`, `/search`, `/config` and named AI crawlers. `?format=json` is not disallowed. Site terms not checked | PAL: "Our various sports and recreation programs for kids ages 6-19 include: … **Karate** …" with no schedule. The page's newest dated item is 2018 | S per site | **VERIFIED** (endpoint works). Content currency poor |
| 7 | Eventbrite city discovery pages | `https://www.eventbrite.com/d/ny--new-york/self-defense/` | HTML with JSON-LD `ItemList` of `Event` | None | Continuous | name, startDate, location, url | Event page offers/price plus the description quote | Robots does **not** disallow `/d/` (it disallows `/directory/`, `/rss/`, `/atom/`, `*?calendar*`, …). **ToS not verified**: both help-centre ToS URLs I tried returned 404. API `GET /v3/events/search/` returns `{"error":"NOT_FOUND"}` 404 | **VERIFIED:** 12 items today and noisy (concealed carry course, "ICE Defense" sing-in, a 2023 Zoom event). Relevant examples: "Women's Self-Defense Workshop" 2026-12-05, "Self Defense with Active Studios at Gotham Park" 2026-11-14, "Jujutsu Classes" 2026-11-15. `/d/ny--new-york/free--martial-arts/` redirected to generic free events | M | **VERIFIED** (page). Permission **UNVERIFIED** |
| 8 | NYC Parks Events Listing (historic relational tables) | `https://data.cityofnewyork.us/resource/fudw-fgrp.json` (+ `cpcm-i88g` locations, `xtsw-fqvh` categories, `jk6k-yab4` organizers, `ridc-7qqg` links) | Socrata JSON | None | Frozen. Rows updated 2021-08-02. Dates 2013-01-01 to 2019-12-28 | `event_id, title, date, start_time, end_time, location_description, description, cost_free, cost_description, url` | Has an explicit `cost_free` flag, but it is 2013–2019 only, so leads only | `license: null` | **VERIFIED:** 1,159 keyword-matching rows (includes false positives such as "Piping Plover Fencing"), 1,032 with `cost_free='1'`. Recurring free tai chi series (e.g. "Bryant Park Tai Chi", "Free Tai Chi in the Park") show which parks and organizers to re-check | S (one-off research) | **VERIFIED** (historic) |
| 9 | NYCHA Community Facilities | `https://data.cityofnewyork.us/resource/crns-fw6u.json` | Socrata JSON | None | "Quarterly"; rows updated 2025-02-24 | funding agency, `program_type`, status, development, address, sponsor, lat/long | None. Dataset description says "All programs are open to the public" (not a cost statement) | `license: null` | **VERIFIED:** 441 rows, 77 occupied "Community Center - Cornerstone". 1 `Sports - Boxing Program`: sponsor "NYPD's Fighting Finest, Inc.", 1742 Richmond Road, Staten Island (Berry Houses). No schedules | S (venue list) | **VERIFIED** |
| 10 | DYCD Program Sites | `https://data.cityofnewyork.us/resource/ebkm-iyma.json` | Socrata JSON | None | Annually (manual) | program area/type, provider, site name, address, lat/long, `age_range`, slots | None. Program-level, no activity data | `license: null` | **VERIFIED:** 31,677 rows. `date='2026'` has 2,660 rows: 93 Beacon, 101 Cornerstone, 127 Saturday Night Lights, 56 Youth Neighborhood Team Sports in Beacon/Cornerstone areas. 0 providers named martial/boxing/karate/judo/dojo/taekwondo | S (venue list) | **VERIFIED** |
| 11 | Gymdesk-hosted studio sites | e.g. `https://brooklynkungfu.com/schedule` | Server-rendered HTML week grid | None | Weekly | class name, time, day/date | Studio pricing page only. These are paid studios, so at most `free_trial_only` | Robots allows (`/admin/`, `/manager/` disallowed). Terms not checked | Per studio. 3 Gymdesk sites among OSM sites | S per site | **VERIFIED** (structure) |
| 12 | NYC Parks Summer Sports Experience / Kids in Motion | `https://data.cityofnewyork.us/resource/4pta-f4ca.json` | Socrata JSON | None | Monthly, April–October | borough, park, date, `sportsplayed`, attendance | Description says KIM "provides free activities" | `license: null` | **VERIFIED: 0.** `sportsplayed` values contain no martial arts (top values: basketball, flag football, soccer, pickleball) | — | **VERIFIED** (not useful) |
| 13 | Center for Anti-Violence Education (CAE), Brooklyn self-defense nonprofit | `https://www.caeny.org/` (Squarespace). Nav has `/cae-events`, `/programs-1`, `/workshopmenu` | Squarespace | None | Unknown | Unknown | Unknown. Cost model not checked | Squarespace robots as #6 | `/cae-events?format=json` 302-redirected to `/storytelling-hour` (HTML), so no events collection was confirmed | S | **UNVERIFIED** lead |
| 14 | Police Athletic League (PAL) | `https://palnyc.org/sports-and-recreation` | Squarespace | None | Unknown | Program list text | None found | — | Karate named as a program. No schedule or location | S curated | **VERIFIED** page / **UNVERIFIED** classes |
| 15 | Seido Karate | `https://www.seido.com/` (Squarespace + Zen Planner login at `seido.sites.zenplanner.com`) | HTML | Zen Planner pages behind login | — | — | Not checked | Not checked | — | — | **UNVERIFIED** lead |
| 16 | Wikidata | `https://query.wikidata.org/sparql` | SPARQL JSON | None | — | — | — | CC0 (not re-verified) | My query (`P31/P279* Q1415416`, located in Q60) returned 0. The class choice is unverified, so treat as "not established", not "none exist" | — | **VERIFIED** 0 / thin |
| 17 | Meetup | GraphQL API | — | **Pro subscription**. Meetup's API page: "Get API access and more with Meetup Pro … pro gives you API access" | — | — | — | Robots disallows `*/events/rss/*`, `*/events/atom/*`, `*/calendar/*rss*` … | — | — | **VERIFIED: not usable at $0** |
| 18 | USA Boxing club search | `https://usaboxing.webpoint.us/wp15/Companies/Clubs.wp` | Form + JavaScript | None | — | Club name, contact (form result) | None | `robots.txt` on that host returns an HTML page, so no usable robots policy. Terms not checked | — | L / manual | **VERIFIED: manual lookup only** |
| 19 | USA Fencing club list | `https://member.usafencing.org/clubs` | HTML | — | — | — | — | **Robots: `User-agent: *` / `Disallow: /`**. I fetched the page once before reading robots and will not again | — | — | **VERIFIED: not allowed** |
| 20 | Taoist Tai Chi Society | `https://www.taoist.org/` | WordPress | — | — | — | Not checked | — | Homepage has no Event JSON-LD and no free phrases | — | **UNVERIFIED** lead |

Leads from the brief I did **not** check: AAU club finder (robots allows `*` with `Content-Signal: … ai-train=no, use=reference`; no finder URL found), USA Wrestling (TLS name mismatch on `www.usawrestling.org`), USA Karate (`www.usa-karate.org` did not resolve), Krav Maga Alliance, BJJ federations, Luma, Partiful, Mindbody/Momence/WellnessLiving/ClassPass public widget endpoints, Spark Membership, YMCA schedule platform, Boys & Girls Club of Harlem programs, CUNY/Columbia/NYU community classes, hospitals, Access NYC / NYC311 / NYC Service directories. All **UNVERIFIED**.

## 2. Adapter sketches for the top 8

All are $0 apart from bandwidth. Every adapter sends a stable, honest User-Agent, honours `ETag`/`Last-Modified`, and keeps prior rows when a run fails.

### A. NYC Parks recreation-center schedules (#1)
- **Fetch:** monthly GET of `/facilities/recreationcenters`, extracting `/facilities/recreationcenters/<code>` (37 today). Weekly GET of each `/<code>/schedule`, sequential with a ≥3 s delay (one run is about 37 requests). The page shows the current week only. Whether a `?date=` style parameter exists for future weeks was not checked, so do not guess.
- **Parse:** each `<div id="program_<id>">` block gives `<h3>` title and `<p>`s for room, description, `Instructor:`, `Intensity:`, `Ages:`, and `p.registration-link-description`. Grid cells (`p.program`) give the time (`12:00 p - 1:00 p`) and an `href="#program_<id>"` back-reference. Column `<th>` gives the weekday and `M/D`. Infer the year from the fetch date (watch the December→January rollover).
- **Normalize:** title becomes the listing title. Venue is the center name from `<title>` plus the address from the center page. Ages map from `Everyone`/`Child`/`Teen`/`Adult`/`Senior`. Occurrences are `America/New_York` instants. Category comes from a keyword map (Karate, Boxing, Kickboxing, Tai Chi, …). Use word boundaries: `MMA` matched "Filmmaking" in my scan.
- **Dedupe key:** `parks-rc:<center_code>:<program_id>`. The program id looks stable across a week. Stability across seasons is unverified.
- **Free rule:** default `unverified`, because the membership page says martial arts "may require additional session fees" and only under-18 membership is free. Upgrade to `free_with_registration` (eligibility: free youth membership, under 18) only when the program block or its PerfectMind registration page states no fee. Store the quote and that URL.
- **Cadence:** weekly.

### B. NYC Aging OAC Activities (#2)
- **Fetch:** `GET /resource/fzy4-e84j.json?$where=<keyword OR clause on eventname/description>&$limit=1000` (the SoQL I ran is in §6). Check `Last-Modified` first.
- **Normalize:** `eventname` as title, `providername` as organizer, `eventlocation`+`zipcode`+`borough` as venue, `latitude`/`longitude`. `starttime`/`endtime` are floating timestamps, so interpret them as `America/New_York`. Ages: "60+". Normalize borough case (the dataset mixes `BRONX` and `Brooklyn`).
- **Dedupe key:** listing `oac:<dfta_id>:<normalized eventname>`. Occurrence `starttime`. There is no row id, which is a known gap.
- **Free rule:** `free_with_registration` with one shared evidence row: the NYC Aging OAC page quote and URL, method `program_policy`. Note "membership required, 60+". Mark per-activity fees unknown.
- **Cadence:** weekly. Expect 31 MA rows today.

### C. Parks events via Open Data (#3)
- **Fetch:** `GET /resource/w3wp-dpdi.json?$limit=1000`. This replaces the robots-disallowed `/xml/` feed, using the same parsing rules as `docs/sources.md`.
- **Dedupe:** `guid`. **Free rule:** event-specific quote from `description`/`registration_description`, else `unverified`. **Cadence:** daily.

### D. OSM venue backbone (#4)
- **Fetch:** the Overpass query in §6, monthly, one request.
- **Normalize:** venue name, coordinates, address, website, `osm:<type>/<id>` as a venue key. Never create listings from OSM alone.
- **Use:** seeds discovery (§3) and geocodes curated listings for free. ODbL credit is required ("© OpenStreetMap contributors"), and share-alike applies to any derived venue database we publish.

### E. Squarespace `?format=json` (#6) for curated nonprofit pages
- **Fetch:** `<page>?format=json`. Pages that redirect (CAE `/cae-events`) are skipped.
- **Parse:** `collection.typeName`. For event collections use `upcoming[]` (`title`, `startDate` ms, `fullUrl`, `location`, `excerpt`/`body`). For pages, strip `mainContent`.
- **Dedupe:** `sqs:<host>:<item id or fullUrl>`. **Free rule:** quote from the item body. **Cadence:** weekly, only for a human-approved URL list.

### F. WordPress events plugins (Modern Events Calendar, The Events Calendar)
- **Detect:** `Link: <…/wp-json/>` header (seen on Zero G and others) plus `/wp-json/` namespaces (`mec/v1`, `tribe/events/v1`). On the one probed site with a Tribe fingerprint (hotfitnyc.com), `/wp-json/tribe/events/v1/events` returned 404, so the fingerprint alone does not mean the API is on.
- **Parse:** prefer JSON-LD `Event` on the HTML page: `startDate` with offset, `location.address`, `offers.url` as permalink.
- **Free rule:** **ignore `offers.price`**. Only accept text in the title or description such as "Free Open mats", and classify trials as `free_trial_only`.
- **Dedupe:** `offers.url`, or `url` + `startDate`. **Cadence:** weekly per approved site.

### G. Eventbrite discovery pages (#7), only if terms permit
- **Fetch:** a handful of `/d/ny--new-york/<topic>/` pages weekly (self-defense, martial-arts, tai-chi), parse the JSON-LD `ItemList`, then fetch each event page for `offers` and the description.
- **Free rule:** `offers.price == 0` **and** a description quote. Classify trials and "first class free" as `free_trial_only`.
- **Dedupe:** the numeric id at the end of `/e/<slug>-tickets-<id>`.
- **Gate:** disabled until someone reads Eventbrite's ToS (not verified here) and accepts it. Expect heavy keyword noise.

### H. Historic Parks Events tables (#8), one-off lead mining
- **Fetch:** a single SoQL query grouping by title, location and year where `cost_free='1'` and the title matches MA keywords.
- **Output:** a private list of parks and organizers that ran free tai chi or self-defense series in 2013–2019, to re-check against current pages. Nothing is ingested.

## 3. Discovery method at scale (cheap)

1. **Venue seed:** Overpass query (§6) for NYC `sport=*` MA values, plus `leisure=sports_centre`/`amenity=dojo` by name. Add Open Data venue lists: Parks rec centers (37), NYCHA community centers (`crns-fw6u`), DYCD 2026 Beacon/Cornerstone sites (`ebkm-iyma`), OAC providers (`cqc8-am9x`, not inspected). Dedupe by normalized host, then by BIN/BBL where available.
2. **Per host, two GETs at most:** `robots.txt`, then the homepage only if allowed. Run 8 hosts in parallel, one request per host at a time. The probe script I used (`scripts/probe.py` in my scratchpad, not committed) records:
   - JSON-LD `@type`s (`Event`, `EventSeries`, `Course`, `ExerciseGym`, `SportsActivityLocation`);
   - a `Link: <…/wp-json/>` header and `wp-content`;
   - plugin slugs from `wp-content/plugins/<slug>` (`modern-events-calendar`, `the-events-calendar`);
   - Squarespace, Wix, GoDaddy and Webflow fingerprints;
   - booking-platform fingerprints (Mindbody/healcode, Zen Planner, Gymdesk, Momence, WellnessLiving, Kicksite, Spark, Pike13, Glofox, Mariana Tek, ClubReady, PushPress);
   - `.ics`, `webcal://` and Google Calendar embed/iCal links;
   - Eventbrite/Meetup links;
   - phrases like "free class|trial|open mat|self-defense|seminar".
3. **Second hop (only where step 2 found a signal):** `/wp-json/` (namespaces), the `?format=json` of the linked schedule/events page, `sitemap.xml` (`lastmod` tells you if the schedule page changed), and the `.ics` URL.
4. **Triage:** human approval is still required. A site enters ingestion only with an explicit URL and a free-quote rule. Today's yield from 70 OSM sites was 1 Event-JSON-LD site, 0 iCal feeds and 17 sites with free-trial/class wording.
5. **Cost:** about 150 requests per month for the whole OSM set, which is negligible on Vercel Hobby. Run it as a monthly cron or by hand from a laptop.

## 4. What does not work or is not allowed (with evidence)

| Item | Evidence (VERIFIED today) |
|---|---|
| Parks `/xml/` feed, robots | `https://www.nycgovparks.org/robots.txt`, group `User-agent: *`, contains `Disallow: /xml/` and `Disallow: /*xml`. The current adapter target `https://www.nycgovparks.org/xml/events_300_rss.json` falls under it. Use `w3wp-dpdi` instead |
| Eventbrite search API | `curl 'https://www.eventbriteapi.com/v3/events/search/?q=martial'` returns 404 `{"error":"NOT_FOUND","error_description":"The path you requested does not exist."}` |
| Meetup API at $0 | `https://www.meetup.com/api/general/`: "Get API access and more with Meetup Pro … pro gives you API access" |
| USA Fencing member club list | `https://member.usafencing.org/robots.txt` contains `User-agent: *` / `Disallow: /` |
| Governing-body finders | `https://www.usajudo.com/club-finder`, `https://www.usatkd.org/club-locator` and `https://www.usafencing.org/club-finder` all returned 404 (I guessed these paths). USA Judo, Boxing, Taekwondo and Fencing robots allow `*` except `/api/`, `/cdn-cgi/`. USA Boxing links its "Find a Club" to a JavaScript/form app on webpoint.us |
| JSON-LD price as free evidence | Zero G: all 102 `Event` objects carry `"price": "0"`, including normal classes, from the Modern Events Calendar plugin |
| Tribe Events API by fingerprint | `https://www.hotfitnyc.com/wp-json/tribe/events/v1/events?per_page=3` returned 404 JSON |
| Open Data keyword search | Socrata catalog `q=martial arts` and `q=tai chi` on data.cityofnewyork.us returned 0 datasets. NY State (`data.ny.gov`) `q=martial arts` returned 0 |
| Kids in Motion / Summer Sports | `sportsplayed` has no martial arts values |
| Overpass | The default instance returned 406 to a browser user agent and 200 to an identifying one. A second query (`amenity=dojo`) got 502 from overpass-api.de and timed out on overpass.private.coffee, so that tag is not covered |
| Parks rec center banner | The index page says "All Manhattan recreation centers are free through February 9!" with no year. Do not use it as evidence |
| Squarespace sites | Robots disallow `/api/` and `/search`, and block named AI crawlers (`anthropic-ai`, `ClaudeBot`, `CCBot`, …). Our ingestion must not present itself as one of those agents to get around a rule. `?format=json` itself is not disallowed |

## 5. What I could not check

- NYC Open Data–specific terms of use. `opendata.cityofnewyork.us/overview/` now redirects to a nyc.gov page. The general nyc.gov terms say materials "are the property of the City of New York. All rights are reserved." Every inspected dataset has `license: null`. Reuse permission for republishing dataset text is **UNVERIFIED**. Ask the Open Data team, or quote short excerpts with a link.
- Socrata throttling numbers. The docs confirm that app tokens raise limits ("throttle by application, rather than via IP address"), but I did not record the unauthenticated limit.
- Whether Parks rec-center schedule pages accept a future-week parameter, whether `program_<id>` is stable across seasons, and per-program fees on PerfectMind registration pages.
- Eventbrite Terms of Service (two URLs returned 404). Luma, Partiful, Mindbody/Momence/WellnessLiving/ClassPass widget JSON. Google Calendar feeds of specific orgs.
- AAU, USA Wrestling, USA Karate, Krav Maga Alliance, BJJ federations, Taoist Tai Chi locations, YMCA, Boys & Girls Club of Harlem, CUNY/Columbia/NYU, hospitals, Access NYC, NYC311, NYC Service, DOE/PSAL.
- Datasets `cqc8-am9x` (NYC Aging contracted providers) and `u7wp-np5k` (aging providers open to the public), which would map `dfta_id` to addresses. Not inspected.
- Why only 15 OACs report activities, and whether coverage will grow.
- Overpass `amenity=dojo` (server errors). Wikidata with a better class choice.
- Santa's Knights' own Wix site has only a `WebSite` JSON-LD type, so there is no structured schedule there. Its schedule needs curated entry.

## 6. Reproduction

```bash
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
# Catalog search (unauthenticated)
curl -s "https://api.us.socrata.com/api/catalog/v1?domains=data.cityofnewyork.us&q=older%20adult&limit=12&only=datasets"
# OAC tai chi / martial rows
curl -s -G "https://data.cityofnewyork.us/resource/fzy4-e84j.json" \
  --data-urlencode "\$where=upper(eventname) like '%TAI CHI%' OR upper(description) like '%TAI CHI%' OR upper(eventname) like '%QIGONG%' OR upper(description) like '%MARTIAL%' OR upper(description) like '%SELF DEFENSE%' OR upper(eventname) like '%KARATE%' OR upper(eventname) like '%BOXING%' OR upper(eventname) like '%KUNG FU%'" \
  --data-urlencode '$limit=1000'
# Parks events via Open Data (replaces /xml/ feed)
curl -s "https://data.cityofnewyork.us/resource/w3wp-dpdi.json?\$limit=1000"
# Historic free MA Parks events
curl -s -G "https://data.cityofnewyork.us/resource/fudw-fgrp.json" \
  --data-urlencode "\$select=title,date_extract_y(date) as y,count(*)" \
  --data-urlencode "\$where=cost_free='1' AND (upper(title) like '%TAI CHI%' OR upper(title) like '%KARATE%' OR upper(title) like '%SELF DEFENSE%' OR upper(title) like '%BOXING%')" \
  --data-urlencode '$group=title,y' --data-urlencode '$order=count(*) desc'
# Rec center schedule (one center; space requests >=3 s)
curl -s -A "$UA" "https://www.nycgovparks.org/facilities/recreationcenters/M058/schedule"
```

Overpass query (POST as `data=`, with an identifying User-Agent):

```
[out:json][timeout:90];
area["wikidata"="Q60"]->.nyc;
(
 nwr(area.nyc)["sport"~"martial_arts|karate|judo|taekwondo|boxing|kickboxing|jiu-jitsu|jiu_jitsu|aikido|kung_fu|wushu|mma|muay_thai|capoeira|krav_maga|fencing|wrestling|tai_chi|kendo|sambo|hapkido|kyokushin"];
 nwr(area.nyc)["leisure"="sports_centre"]["name"~"[Dd]ojo|[Kk]arate|[Jj]udo|[Bb]oxing|[Mm]artial|[Jj]iu|[Tt]aekwondo|[Kk]ung [Ff]u|[Tt]ai [Cc]hi"];
);
out tags center;
```
