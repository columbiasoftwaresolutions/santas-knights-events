# Community, organizations and ideas — research notes

Researched 2026-11-11 (the demo runs in winter). Public pages only, honest user agent, robots.txt honoured. Nothing was submitted, no one was contacted.

**Labels.** `VERIFIED` means the page was opened on 2026-11-11 and the statement is what it says. `LEAD` means it came from a search result or another page and was not opened. Quotes marked **(verbatim)** were read directly from the HTML. Quotes marked **(excerpt)** came through a page-summarizing fetch tool: re-capture them verbatim before they become evidence rows. This note does not duplicate the deterministic-source and AI/scraping researchers; where an idea touches their ground it is flagged.

Takeaway first: of everything checked, **only Santa's Knights, Henry Street's Jacob Riis Cornerstone, a Harlem Hospital Shape Up class and a Bronx boxing gym state "free" in words a listing can quote**, and each has a gap (no schedule, stale date, or no cost sentence on the class page). Several well-known "free" programs turned out to charge. Plan the demo around a small, honest set.

---

## 1. Santa's Knights: what a real listing needs

### 1.1 What the site says (all VERIFIED 2026-11-11, verbatim, from `https://www.santasknights.org`)

- Organization: founded 2015, 501(c)(3), Harlem. Founder page: <https://www.santasknights.org/santas-knights>. Class address on every page footer and on `/contact`: Manhattanville Community Center, 530 West 133rd Street, New York, NY 10027. Phone (212) 873-5818, `contact@santasknights.org`. Footer says © 2021. These are published contact details of the organization.
- Free claims, three independent pages:
  - `/in-person` (the class list): "All classes are 100% FREE, 100% of the time, no-questions-asked!"
  - `/pricing-plans/membership`: "All classes with Santa's Knights are FREE! There are no payments required!" and the plan "Class Membership $0 … 100% free membership that lets you sign up for all classes!"
  - Mission line in every footer: "Santa's Knights' mission is to bring free martial arts, fitness, and activities to everyone…" This is mission language, not class evidence. Prefer the first two.
- Registration: `/in-person` says "book all the classes that you'd like online or through the app!" and "Use the app to register for and manage your classes! The app is 100% FREE, always!" Each class has a Book Now button. A Class Membership ($0) account is the sign-up route.
- Donations are optional ($20 to $500 monthly plans on the membership page). A donation is never a class condition on that page.

### 1.2 The six class pages (VERIFIED, verbatim text of `/service-page/<slug>`)

The full set comes from `https://www.santasknights.org/booking-services-sitemap.xml`. Every page has an empty "Upcoming Sessions" block in the served HTML: no days, times or durations exist in the static page. `/in-person` shows "Loading days…" for every class.

| Class (URL slug) | Who / where as published | Cost evidence on the class page itself | Status for the directory |
| --- | --- | --- | --- |
| Gladiator Bootcamp (open to all levels) `gladiator-bootcamp-open-to-all-levels` | "Adults & Teens"; 530 West 133rd Street; "Duration Varies"; Book Now. Spar-only rule: "Bringing your own groin protection is required if you intend to spar at all." | None on the page. Free rests on `/in-person` and membership pages above | Listable as `free_with_registration` once a schedule is supplied. Cost evidence = `/in-person` quote |
| Women's Medieval Combat & Fitness `women-s-medieval-combat-fitness` | Women-only; "Ages 18+ \| All skill levels welcome \| Equipment provided for beginners"; 530 West 133rd Street; Book Now | None on the page. Free rests on `/in-person` | Same as above |
| Gladiators NYC for Military Veterans `gladiators-nyc-for-military-veterans` | "This class is for U.S. Military Veterans (sponsored by the Department of Veterans Services)"; "Partnered with NYC Department of Veteran Services & Joseph P. Dwyer Veteran Peer Support Project"; same address; Book Now. Session format: warm-ups, conditioning, drills, sparring, discussion | None on the page. Free rests on `/in-person` | Same, with eligibility "U.S. military veterans" |
| Gladiator Armored Practice (advanced) `gladiator-armored-practice-advanced` | "Adults (as fighters & spectators) & Teens/Children as spectators"; same address. Page banner: "This service is not available, please contact for more information." Body: "All 100% free! … Open to new fighters, but contact us first!" | Class-level quote exists ("All 100% free!") | **Hold.** The page flags itself unavailable while `/in-person` still lists it with Book Now. Ask before publishing |
| Medieval Combat Fundamentals `medieval-combat-fundamentals` | 670 Lafayette Ave, Brooklyn, NY 11216 (the only non-Harlem class); banner "This service is not available" | None | **Hold.** Unavailable banner, and no schedule or cost on the page |
| Women's (Premium) Combat Class – Midtown `women-s-premium-combat-class-midtown` | 246 West 38th, #702, New York, NY 10018; banner "This service is not available" | The page says: "For July and August, your first 4 sessions are free — no commitment. After that? $30/week to keep training" | **Never `free`.** At most `free_trial_only` for a past promotion (year not stated), and it contradicts the site-wide "all classes free" line. Per the spec, conflicting cost means `unverified`. Treat it as the canonical test case for "free claim vs. paid class" |

Other things on the site:

- **Gladiator Kids** appears only in the Bootcamp description ("Gladiator Kids (for children) and Gladiator Bootcamp (for adults)"). It has **no service page, no sitemap entry and no schedule**. Do not list it until the team supplies a page or date.
- `/online` is a video library ("Gladiators NYC - Intro Class", 02:31). Free online video, not a class event.
- `/letters-to-santa` is titled "Santa's Knights 2024 Program". It is a gift-matching flow (children's letters, "Adopt a letter"), not a class. It is seasonal (December) and its title looks a year old. Ask whether the 2026 process is the same.
- `/groups` is a Wix member forum. On 2026-11-11 its feed showed unrelated, spam-looking posts. Do not link to it from the directory.
- `gladiators.nyc` is the sister team site (armored combat league, shop). Its sitemap lists only one event, "NYC Medieval Festival". It is not a class source.
- The site is actively edited. In `https://www.santasknights.org/sitemap.xml` the `lastmod` for `booking-services` is **2026-11-07** and for `pages` is **2026-11-10** (VERIFIED).

### 1.3 How the Wix site could expose a schedule (VERIFIED unless noted)

- `robots.txt` allows `/` (only `*?lightbox=` is disallowed), so ordinary page fetches are permitted. The sitemap index lists: `group-lists`, `group-posts`, `booking-services`, `pricing-plans`, `pages`.
- JSON-LD on the service pages is **only `ImageObject`**. There is no `Event`, `Course` or `Service` JSON-LD.
- Sessions are rendered in the browser. The `/booking-calendar/<slug>` page returns a shell ("Schedule your service … Filter by: Staff Member (All)") with no dates in the HTML.
- So a static fetch gives: class names, ages, address, descriptions, and the cost sentences above. It does **not** give days or times. Getting those requires one of:
  1. The team sends a plain weekly schedule (a text message or a Google Sheet row). This is the lightest option and it is a person-confirmed source.
  2. The team publishes a schedule page as plain text, or a public Google Calendar / `.ics` link. LEAD: Wix has Google Calendar sync for its business calendar; this was not checked here.
  3. Calling the Wix Bookings REST API with the owner's credentials. LEAD, not tested. It would need a key held by the organization, so it is not a prototype path.
- Recommendation: **curate Santa's Knights by hand**: three to four listings (Bootcamp, Women's, Veterans, and Armored Practice after confirmation), URL = each `service-page`, cost quote from `/in-person`, schedule text supplied by the team, and a "check the Book Now page for current dates" link. Poll the sitemap `lastmod` (see Ideas) and re-check only when it moves.

### 1.4 What the partners page contains

`/santas-knights` has a "PARTNERS" block that is **logos only, no names or descriptions**. Logo `alt` text and link targets in the HTML (VERIFIED): Combat Wounded Veterans of America (`cwvoa.org`), Wounded Warrior Project, New York City Police Department (NYPD Community Affairs page), Armored Combat Worldwide (`acwknights.com`), NYU, Future Labs (`futurelabs.nyc`, including a "Veterans Future Lab" link), Graham Windham, New York Adventure Club, Bohemian Hall, ClassPass, Kohl's, Whole Foods Market, Draft Barn Beach, Google.

Reading: this is a sponsor/venue/press wall, not a list of free-program providers. The relationship of each logo is not stated on the page. Worth a question to the team: Graham Windham (a child and family services organization, LEAD), Combat Wounded Veterans of America and the NYPD (the NYPD also runs Cops & Kids, section 2) are the plausible overlaps. Do not turn logos into listings.

---

## 2. Organization map

Only rows backed by a page opened today, plus clearly marked LEADs. "Change rate" is my estimate from what the page shows, not measured. Cost status uses the spec's vocabulary; nothing below is a finished listing.

### 2.1 Opened and verified

| Organization | Where | Offer / who | Cost claim and exact page | Calendar? / change rate | Directory status |
| --- | --- | --- | --- | --- | --- |
| **Santa's Knights** | Harlem (530 W 133rd St); one Brooklyn class page | See section 1 | "All classes are 100% FREE…" — <https://www.santasknights.org/in-person> (verbatim) | Wix booking calendar, JS-rendered; site edited 2026-11-07/10 | `free_with_registration`, schedule needed |
| **Henry Street Settlement, Jacob Riis Cornerstone (JRC) evening & weekend programs** | Lower East Side, Manhattan: 80 Avenue D | Youth: middle and high schoolers and young adults. Weekdays 6–10 p.m., Saturdays 10 a.m.–5 p.m. | "Free activities like cooking and martial arts classes, monthly trips, boxing, music, tech activities…" — <https://www.henrystreet.org/programs/athletics/sports-programs/> (verbatim) | No calendar on the page; undated page, so unknown change rate | Program-level only. No discipline, day or time of the martial arts class is stated. Ask JRC. Candidate `free` once a class date exists |
| **Harlem Hospital Center: Shape Up NYC class** | Harlem: 506 Lenox Ave, third-floor rehabilitation dayroom | "Wednesdays at 6:00pm Kickboxing/Body Sculpt" (all ages not stated) | Page shows the word "FREE" above the class list — <https://gethealthyharlem.org/articles/shape-nyc-harlem-hospital-center-class-schedules> (verbatim). Page is dated **January 16, 2026** | Static post, rarely updated | Kickboxing/fitness, not strictly martial arts. Stale (10 months old). `unverified` until re-dated |
| **City Parks Foundation Seniors Fitness** | Neighborhood parks citywide (locations not listed on the page) | Age 60+. Yoga, pickleball, walking, tennis; tai chi has its own registration button | "offers free instruction in a variety of fun activities in parks" — <https://cityparksfoundation.org/SENIORS-FITNESS/> (excerpt). Season "Spring – Fall"; registration opened March 9, 2026 | Per-activity LeagueApps pages; seasonal | Out of season now. Good April-to-October source. Re-check each March |
| **Brooklyn Public Library (branch event pages)** | Branches, Brooklyn | Examples: "FREE Women's Self Defense Class", Sat Jun 15 2024, 1–2 pm, Eastern Parkway Learning Center, run by a Brazilian jiu jitsu instructor. "Tai Chi", Thu Jul 9 2026, 6–7 pm, Gerritsen Beach Library, 2808 Gerritsen Ave, Adults — <https://www.bklynlibrary.org/calendar/tai-chi-gerritsen-beach-library-20260709-0600pm> | The 2024 page says FREE in the title. The 2026 tai chi page **does not say free or paid** (excerpt) | Permalinks render server-side; the calendar itself is a JS shell (see `docs/sources.md`). New events appear weekly | The tai chi event is in the past, and even a library event page may not state cost |
| **NYC Cops & Kids / NYPD Boxing** | Bronx gym: 1761 Walton Ave, Mount Hope; Brooklyn and Staten Island gym registration | Youth boxing. Ages not stated on the homepage | Homepage has registration links (Bronx: gymdesk; Brooklyn/Staten Island: Jotform) and **no cost wording** (excerpt) — <https://www.copsandkidsboxing.com/>. News12 (Sep 6, 2025) calls the Bronx gym a "no-cost boxing program for students" — <https://bronx.news12.com/bronxs-first-free-boxing-gym-opens-in-mount-hope> (excerpt) | No schedule on homepage; page also advertises a "New December 2026 Event" with ticket sales (not a class) | Candidate `free_with_registration`: needs the org's own cost sentence, ages and hours |
| **Abadá-Capoeira NYC** (nonprofit-style school) | Locations not stated on the fetched page | Capoeira; kids 5–12, teens 13–19, adults | "Teens 13-19 train for free every day"; kids 5–12 "from families unable to afford fees can access classes for free during the school-year session upon request"; new adults get a free class on the first Tuesday monthly — <https://www.abada.org/> (excerpt) | Weekly schedule shown (mixed online/hybrid/in-person) | Mixed: free teens, sliding for kids, trial for adults. Needs location and a per-audience listing. Possible `sliding_scale`/`free` split |
| **Peter Westbrook Foundation** | Fencers Club, 20 W. 33rd St., Manhattan | Youth fencing, Saturdays 9am–12pm, Sept–June | **Not free.** "The enrollment fee for the Saturday Fencing Program is $200 per student for the season." — <https://www.peterwestbrook.org/programregistration> (excerpt). Elsewhere: "at little to no cost" — <https://peterwestbrook.org/impact> (excerpt) | Season Sept–June; enrollment July–August (excerpt) | `sliding_scale`/`unverified`. Marketing says "little to no cost"; registration page shows a fee. A good example of a conflict |
| **Women's Empowerment Self Defense Academy (W.E.S.D.A.)** | Bronx: 2132 E. Tremont Ave | Women's self-defense, teen girls 13–21, kids 4–12, seniors, and Fuji Ryu Jujitsu for ages 3+ | **Cost and schedule not listed** — city community-board toolkit page <https://www.nyc.gov/assets/dycd/digital_toolkit/cb_resources/resource/womens-empowerment-self-defense-academy/> (excerpt). No date on page | Static listing | `unverified`. Real organization, no cost evidence. Outreach target |
| **Malikah** | Astoria, Queens (membership base); trainings for partner communities | Self-defense and safety programs for women and girls | Homepage: "We offer self-defense & safety programs." **No cost wording** — <https://www.malikah.org/> (excerpt). Sub-pages `/programs`, `/events`, `/partner` exist but were not opened | Has an events page (LEAD) | `unverified` |
| **Female Fight Club** (CitizensNYC grantee) | Bronx (per grant text) | Self-defense for women and teenagers | Grant page: "self-defense project aims to empower women and teenagers in the community" — <https://www.citizensnyc.org/grantees/female-fight-club/> (verbatim). No cost line seen | Grant listing, static | `unverified` |
| **New York City MMA Inc.** (CitizensNYC grantee, 2025) | Grasmere, Staten Island | Karate, jiujitsu, kickboxing, taekwondo | A scholarship for two students, "free of charge for one year", chosen by need — <https://www.citizensnyc.org/grantees/new-york-city-mma-inc/> (excerpt). The studio's own site lists no prices (excerpt) | None | Not a public free class. Do not list as `free` |
| **Chinese-American Planning Council (CPC)** | Hong Ning Housing (no street address) | One tai chi session for older adults | Article names the session and date; cost **not stated** — <https://www.cpc-nyc.org/node/4346> (excerpt). Year not shown (images suggest 2023) | One-off article | Stale one-off; only a lead for the CPC senior-center network |

### 2.2 Leads, not opened (do not publish)

| Organization | Source of the lead | What it suggests |
| --- | --- | --- |
| NYC Parks Shape Up NYC (free fitness classes incl. tai chi, kickboxing) | Search results for `nycgovparks.org/events/shape-up-nyc` | Parks HTML returns **HTTP 403** to an honest user agent. I did not work around it. The JSON feed is the other researcher's topic |
| NYC Parks recreation centers | Search snippets of the official membership page | Snippets say youth and young adults 18–24 are free, seniors $25 or free with ID, adults $100–150, and **martial arts classes carry separate session fees**. The snippets conflict with each other. Verify against the official page before saying anything |
| Boys & Girls Clubs, YMCAs, Educational Alliance, Grand Street Settlement | Named in the brief | `eany.org` returned 403, `grandstreet.org` did not connect from here, YMCA and club pages were not read for martial arts. These are unexplored, not negative findings |
| Atlas Cops & Kids (East Flatbush), LeftHookNYC (Bushwick NYCHA centers), She Fights | Older news articles (2017–2021) | Free youth boxing, but status today is unknown |
| Academy of Medical & Public Health Services (AMPHS), POP Gym | Brooklyn library event pages (2023 to 2026), a 2023 guide | Recurring free self-defense workshops at library branches, delivered by outside instructors. The 2026-06-26 Kings Highway workshop was found in search results |
| Flushing BID free self-defense classes for business owners | News story (2024) | The page I tried returned 404. Narrow audience anyway |
| Council members | Council press releases from 2011–2013 | Offices have sponsored free classes. I found no 2026 example. Council press page is worth a keyword watch |
| Korean Cultural Center NY | Search | No current taekwondo class found, only old news. Not a source |
| Veterans: Combat Wounded Veterans of America, Wounded Warrior Project, NYC Dept. of Veterans' Services, Joseph P. Dwyer Peer Support Project | Santa's Knights pages | They are named as partners or sponsors of the SK veterans class. No separate NYC martial arts listing was found |

### 2.3 Seen and rejected as "free"

- Asphalt Green kids' martial arts: paid (a search snippet lists $432 public / $367.20 member for a winter 2026 session). LEAD only.
- Tiger Schulmann's, Kano Martial Arts, Combat Club, Training Zone and similar: free **trials** at commercial schools. They fit `free_trial_only`, not default results.
- A "Chinatown AOA April 2026" tai chi calendar that surfaced in search is hosted on `ymcasf.org`, the San Francisco YMCA. It is **not** New York. Excluded.
- Not covered at all (no verified rows): CUNY and other colleges, houses of worship, NYCHA community centers beyond Cops & Kids, wushu groups, Japanese cultural centers. They are categories, not leads. Add them only when a page is opened.

---

## 3. Aggregators and directories

| Source | Covers | Reuse / terms | Use as |
| --- | --- | --- | --- |
| **discoverDYCD** — <https://discoverdycd.dycdconnect.nyc/> | DYCD-funded youth and afterschool programs; search by borough, neighborhood or zip (per <https://www.nyc.gov/site/dycd/services/discoverDYCD-resources.page>, verbatim) | VERIFIED: the site is a JavaScript app shell (200, 13 KB). Its `/robots.txt` returns the app shell, not a robots file. No terms page was found. Martial-arts filtering not confirmed | **Link-out and a seed list**. Do not scrape an SPA whose terms are unknown |
| **DYCD community-board resource toolkit** — `nyc.gov/assets/dycd/digital_toolkit/cb_resources/resource/<provider>/` | One city-published page per provider (W.E.S.D.A. verified) with address, services and audience, often **no cost** | City page; no reuse terms read. Content is the provider's description | **Seed list for outreach.** Each page carries a contact and an audience tag, which is the right first message target |
| **CitizensNYC grantee directory** — `citizensnyc.org/grantees/...` | Neighborhood grants for small groups (self-defense, MMA scholarship found) | Terms not read | Seed list of small nonprofits that appear in no big directory |
| **findhelp.org** | Social-services search | VERIFIED: `robots.txt` has `User-agent: *` then `Disallow: /` | **Must NOT be scraped.** Link-out only, if at all |
| **Mommy Poppins / CourseHorse / KidPass / enrichment.kids** | Mostly paid kids' classes and trials | Mommy Poppins robots file was opened, terms were not reviewed. `docs/sources.md` already excludes it | **Do not ingest.** At most a human might see a name there and then find the organization's own page |
| **NYC Parks events** | Parks-run and partner events | HTML returns 403 to an honest user agent (VERIFIED). Covered by the feed researcher | Not repeated here |
| **Library event pages** (BPL, QPL, NYPL) | Branch events. BPL permalinks are readable and indexed (two opened today). QPL permalink redirects to the outage page | Terms not read | Cost wording on the page varies (see 2.1). Treat the page quote as the evidence, not the library's identity as "free" |
| **211 / NYC Well** | Resource hotlines and directories | `211nyc.org` did not connect from here (LEAD). Nothing opened | Partner or referral target, not a data source (see 4) |
| **gethealthyharlem.org** | A local health coalition's event posts, including Shape Up classes | Terms not read | Good for Harlem, with a date on each post. Hand-check; do not crawl |

---

## 4. Crowdsourcing designs (lightest version, for volunteers)

All designs assume the spec's rules: a free listing needs a quote, URL, source and capture time, and nothing publishes without them. Cost figures are estimates, not quotes.

### 4.1 "Suggest a class" form

- **Fields:** class name, organizer, page URL (required), **the sentence on that page that says it is free (required)**, borough, optional contact email for follow-up. A hidden honeypot field and a link-count check cover spam.
- **Flow:** submission lands as a `hidden` record with `discovered_by = 'crowd'`. A volunteer opens the URL, confirms the quote exists, then promotes it.
- **Cost:** about 6–8 hours to build on the existing stack. $0 on current free tiers. Volunteer time is ~5 min per submission. Expect few submissions, so budget about 1 hour per month.
- **Risk:** people will paste a marketing claim without checking the registration page (the Westbrook pattern). The "paste the sentence" field is the whole defense.

### 4.2 Organizers claim and confirm by magic link

- **Design:** no accounts. Each listing stores the contact address **the organizer already published** (e.g. `contact@santasknights.org`). A monthly email sends a signed one-time link to a three-button page: "Still free, nothing changed / Changed / We stopped." "Changed" opens a short form. The reply becomes new evidence, with `method = 'organizer-confirmed'`.
- **Cost:** about 10–15 hours to build. Email delivery fits inside the free tier of common transactional providers (check current limits). Volunteer time is 1–2 hours per month to chase non-responders.
- **Rule:** a click proves the sender read the email, not that the class is free. Store it as a separate evidence method and keep the org's quoted sentence as the cost evidence.

### 4.3 Flyer and email inbox

- **Design:** one shared address such as `listings@…`. Volunteers (or Santa's Knights staff) forward flyers or announcements. A human types the five fields into the suggest form. Do not add AI extraction here: that belongs to the other researcher, and the spec defers it.
- **Cost:** $0 for the mailbox, about 10 minutes per item. Fits a 2-hour weekly "triage hour".
- **Caveat:** a flyer's cost line is evidence only if you can show the flyer. Keep the image or text attached to the evidence row, and the original organizer's page link if any exists.

### 4.4 QR codes on flyers

- **Design:** a printed A5 sheet "Free classes near you" at Manhattanville Community Center and partner sites. The QR opens the directory pre-filtered to Harlem, and a second QR next to each listed class opens a one-tap "this ran when I went" page (see Ideas 3).
- **Cost:** about 3 hours to design, then print cost (a short run is typically tens of dollars; confirm with a printer). Refresh when the schedule changes, so a **dated** sheet is better than a permanent one.

### 4.5 Students and volunteers verify listings

- **Design:** a monthly list of 3–5 listings per volunteer, in the order of oldest `last_verified_at`. The volunteer visits or calls, then fills the same confirmation form as 4.2 with their name and method ("visited", "called", "saw the page").
- **Cost:** about 20 minutes per listing. Ten volunteers doing three checks a month is about 10 hours total, split across all of them. Santa's Knights already runs "Adopt a letter" with volunteers; "Adopt a listing" reuses that culture (see Ideas).

### 4.6 Periodic "still free?" check

- **Design:** a fixed rotation: every listing is re-checked at least once per season and before a demo. Records that can't be confirmed in a cycle drop back to `unverified`. The spec defers an automatic stale policy; this note only suggests the human rhythm.
- **Cost:** 1–2 hours per month at 30–50 listings.

### 4.7 Partnerships (211, NYC Well, schools, libraries, community boards)

- **Lightest version of each:** a one-page ask by email: "May we link to you, and may you link to us? We publish only quoted-free classes with a checked date." Start where a person already helped: the veterans class is "sponsored by the Department of Veterans Services" (VERIFIED on the SK page), so that agency is a warm intro.
- **Community boards** hold the district's service lists (the DYCD toolkit is the city's own version). A short email to a district manager asking for "free fitness or martial arts programs in your district" costs about 20 minutes each and returns names, not data. I did not test this.
- **Cost:** 1 hour per partner to draft and send. Expect most to take weeks to reply. Treat replies as leads that go through 4.1, not as a feed.

---

## 5. Seasonality and coverage reality check

What the pages I opened show (dates are from the pages, not a general study):

| Season / window | What runs |
| --- | --- |
| **Spring to fall** | City Parks Foundation Seniors Fitness ("Spring – Fall", six-week blocks, registration opened March 9, 2026). Bryant Park tai chi April 28–August 25 and martial arts June 4–September 24, 2026 (from `docs/sources.md`). Brooklyn library tai chi, qi gong and self-defense events I found were June–July 2026 |
| **School year (September–June)** | Peter Westbrook Saturday fencing (third Saturday of September to early June, enrollment July–August, paid). Abadá-Capoeira's free class terms are for "the school-year session" |
| **Year-round / winter-capable (indoor)** | Santa's Knights at Manhattanville Community Center (indoor; schedule unknown). Henry Street JRC evening and weekend programs (undated). Cops & Kids gyms (Bronx gym opened September 2025). Harlem Hospital's Wednesday evening class (post dated January 2026) |
| **Past promotions** | SK Midtown "July and August" free sessions (a paid class now) |

**What to expect for the demo (today is 2026-11-11).**

- Outdoor and Parks-run series are mostly over. `docs/sources.md` already says Bryant Park's 2026 seasons have ended.
- Strongest winter sources are **indoor, evening and weekend programs run by settlement houses, Cornerstone centers, hospital-based Shape Up classes, Cops & Kids gyms and Santa's Knights itself.** Those are exactly the sources where a person must supply the schedule, because few publish a calendar.
- Library events continue indoors year-round, but my searches returned only past 2026 events. That says something about the search index, not about the library. Check the current calendar by hand.
- December has a second effect: "Letters to Santa" is Santa's Knights' high season, so contact the team early. Whether classes pause for the holidays is **unknown**; ask.
- A directory that shows 4–8 honest, dated winter listings with "no outdoor series until spring" is more credible than a padded one. The spec already accepts honest empty results.
- Do not show "returns next summer" or "opens March" for any 2027 date. No 2027 date was verified. Show "last season: …" with the verified 2026 dates instead.

---

## 6. Ideas, ranked by value ÷ effort

Value and effort are 1–5 (value high is good, effort high is expensive). Ideas marked ★ are the ones I expect to surprise the team.

| # | Idea | Value | Effort | Why |
| --- | --- | --- | --- | --- |
| 1 | **Quote-first intake.** Every suggestion, flyer and volunteer report must include the page URL and the one sentence that says it is free. Treat "no sentence" as `unverified`. | 5 | 1 | This is the spec's evidence rule, applied at the door. It is what would have caught Westbrook ("little to no cost" vs a $200 fee) and the Midtown class |
| 2 | **★ "Looks free, isn't" ledger.** Publish (or keep) a short list of checked non-free programs with the sentence that shows the price: Westbrook $200/season, SK Midtown $30/week, commercial trials. Hidden records with evidence are already allowed by the spec. | 4 | 1 | Saves volunteers from rechecking. Protects users from a wrong "free" claim. Costs almost nothing because the checks already happened |
| 3 | **★ "Ran today" tap.** For Santa's Knights classes, the instructor (or QR on the sheet) taps once after class. The listing shows "last confirmed running: date". | 5 | 2 | It verifies that the class **happened**, which is what a family wants and what a page quote cannot show. Keep it a separate field from cost verification (the spec says unchanged sightings do not advance cost verification) |
| 4 | **Sitemap `lastmod` as the change detector.** One request a day to `sitemap.xml`; re-read a class page only when its sub-sitemap date moves. For Santa's Knights: `booking-services` lastmod 2026-11-07 (VERIFIED). | 4 | 1 | Cheap, polite, and avoids re-fetching 1.2 MB Wix pages. Works for any site that publishes sitemap dates. Overlaps the scraping researcher; included because it was verified on the actual target |
| 5 | **Seasonal re-open calendar.** Store, per organization, the last verified season dates and a "ask again in" month (e.g. March for City Parks Foundation Seniors, July for Westbrook enrollment). A volunteer gets a monthly "who to ask" list. | 4 | 2 | Turns seasonality into a to-do list rather than stale rows |
| 6 | **Organizer magic-link confirm** (4.2), sent to the contact each organization already publishes. | 4 | 3 | Moves upkeep to the people who know. Keep it one click |
| 7 | **★ "Adopt a listing."** Reuse Santa's Knights' own "Adopt a letter" habit: a volunteer adopts one listing, confirms it monthly, and their name appears on the evidence row (method "visited/called"). | 4 | 2 | Fits the team's culture (verified on their letters page). Spreads the work thin |
| 8 | **Outreach seed list from city pages.** Walk the DYCD community-board toolkit and the CitizensNYC grantee pages by hand for martial arts, boxing and self-defense providers, and send each a one-line "can you send your schedule?" email. | 3 | 2 | Finds small groups that no aggregator lists (W.E.S.D.A., Female Fight Club, NYC MMA were all found this way). Hand-checked, so no scraping terms issue |
| 9 | **Library permalink search.** Search `bklynlibrary.org/calendar` pages by keyword once a week (the URL slug carries the date and time, e.g. `…20260709-0600pm`), open each permalink, and add dated occurrences. Cost wording must still be captured per page. | 3 | 3 | BPL permalinks render without JavaScript, unlike the calendar. Does not require the calendar app. Touches the library-adapter question in `docs/sources.md`; flag to that researcher |
| 10 | **★ Demand map from public asks.** NYC participatory-budgeting proposals and council statements show neighborhoods asking for free self-defense classes. Use them to decide which boroughs to recruit in first. | 2 | 2 | Surprising use of civic data: you recruit where residents already asked. LEAD, I did not open a proposal |

---

## 7. Open questions for the Santa's Knights team

Cost and eligibility

1. Is every class free, including the Midtown "Premium" class at $30/week? If it is paid, can the site make that explicit, or remove the "all classes free" line from pages next to it? Right now a quote and a price sit side by side.
2. Which classes are really running? Armored Practice, Medieval Combat Fundamentals (Brooklyn) and Midtown show "This service is not available", yet appear on `/in-person` with Book Now.
3. Is there a cost, deposit, membership or equipment charge for any class? The pages only say to bring your own groin protection to spar. Does the Class Membership ($0) require an account before attending?
4. Residency or age limits: is Women's 18+ exactly that? Are teens allowed in Bootcamp (page says "Adults & Teens")? What minimum age for Gladiator Kids?
5. Veterans class: is it open to all US veterans, regardless of where they live? Who confirms eligibility?

Schedule and places

6. What are the weekly days and times for each class, and where on the site can a volunteer read them without the app? Can the team supply a plain text schedule or a public calendar link?
7. Does **Gladiator Kids** exist today? Where, when, what ages? Why does it have no service page?
8. Is 530 West 133rd Street the only active site? Are there other venues (Brooklyn 670 Lafayette Ave, Midtown 246 West 38th) in use?
9. Do classes pause around the holidays, in winter weather or in summer?
10. Which year's "Letters to Santa" program is current? The page says "2024 Program". Is there an end date?

Permissions and partners

11. May the directory quote the site's free wording and link to each class page? Who will say yes, and by what channel?
12. Who should receive the monthly "still free?" link, and who is the backup when they are away?
13. Which logos on the Partners page are free-program partners versus sponsors or press? In particular: Graham Windham, Combat Wounded Veterans of America, the NYPD, the Department of Veterans Services and the Dwyer Project. Would they accept a short introduction?
14. Does the team know of other free martial arts, boxing, self-defense or tai chi programs in Harlem, the Bronx or Brooklyn that students already attend?
15. Would instructors or students use a one-tap "ran today" check (Idea 3), and would the team keep the QR flyer at Manhattanville Community Center?

---

### Method notes and limits

- Pages were fetched with `curl`, a small script, or a fetch tool, using a descriptive non-browser user agent. robots.txt was checked programmatically before fetching Santa's Knights, gladiators.nyc, PAL, Henry Street, Peter Westbrook, Malikah and Cops & Kids, and was read for findhelp, Mommy Poppins and NYC Parks. For pages fetched only through the fetch tool (CitizensNYC, Abadá, BPL, CPC, News12, the DYCD toolkit) robots.txt was not separately checked, so re-check before any automated use. Pages that blocked the honest agent (NYC Parks HTML, Educational Alliance) were not worked around.
- This file was not run through the repo's format check (`pnpm check`); tables may need `prettier` alignment.
- I did not open the paid pages, trial pages, or any page behind a login.
- Search snippets were used only to find names. Nothing marked VERIFIED depends on a snippet alone.
