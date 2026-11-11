import { listingPayload } from "../build";
import { fetchText, type FetchImpl } from "../http";
import { containsQuote, htmlToText } from "../quote";
import type { ListingPayload, Source, SourceDef, SourceResult } from "../types";

// Listings a person has read and approved. Each carries the quote that justifies
// its cost status and the page it came from. At every run the quote is looked up
// on that page again: if it is gone, the listing is kept but drops to "unverified".
// Quotes below were checked verbatim against the live pages on 2026-11-11.

const SK_FREE_PAGE = "https://www.santasknights.org/in-person";
const SK_FREE_QUOTE = "All classes are 100% FREE, 100% of the time, no-questions-asked!";
const SK_ADDRESS = "530 West 133rd Street, New York, NY 10027";

interface CuratedEntry {
  listing: Parameters<typeof listingPayload>[0];
  // Page that must contain `quote`, and the claim it supports. Null: no evidence.
  evidence: { quote: string; url: string } | null;
}

const santasKnights = (
  slug: string,
  title: string,
  pageSlug: string,
  extra: Partial<ListingPayload>,
): CuratedEntry => ({
  listing: {
    dedupe_key: `sk:${slug}`,
    title,
    category_slug: "class",
    discipline_slug: "medieval-combat",
    venue: "Manhattanville Community Center",
    address: SK_ADDRESS,
    borough: "Manhattan",
    neighborhood: "Harlem",
    latitude: null,
    longitude: null,
    source_url: `https://www.santasknights.org/service-page/${pageSlug}`,
    registration_url: `https://www.santasknights.org/booking-calendar/${pageSlug}`,
    registration_notes:
      "Book through Santa's Knights. The class schedule is in their booking calendar.",
    cost_status: "free_with_registration",
    ...extra,
  },
  evidence: { quote: SK_FREE_QUOTE, url: SK_FREE_PAGE },
});

export const CURATED: ReadonlyArray<CuratedEntry> = [
  santasKnights(
    "gladiator-bootcamp",
    "Gladiator Bootcamp (open to all levels)",
    "gladiator-bootcamp-open-to-all-levels",
    {
      ages_text: "Adults and teens",
    },
  ),
  santasKnights(
    "womens-medieval-combat",
    "Women's Medieval Combat & Fitness",
    "women-s-medieval-combat-fitness",
    {
      ages_text: "Ages 18 and older",
      eligibility: "Women only. All skill levels, equipment provided for beginners.",
    },
  ),
  santasKnights(
    "veterans",
    "Gladiators NYC for Military Veterans",
    "gladiators-nyc-for-military-veterans",
    {
      eligibility: "U.S. military veterans",
    },
  ),
  {
    listing: {
      dedupe_key: "henry-street:jrc-martial-arts",
      title: "Martial arts and boxing at Jacob Riis Cornerstone",
      category_slug: "program",
      discipline_slug: "boxing",
      description:
        "Evening and weekend youth programs at the Jacob Riis Cornerstone. The page lists martial arts classes and boxing; it does not publish class days or times.",
      ages_text: "Middle schoolers, high schoolers and young adults",
      venue: "Henry Street Settlement, Jacob Riis Cornerstone",
      address: "80 Avenue D, New York, NY",
      borough: "Manhattan",
      neighborhood: "Lower East Side",
      schedule_text:
        "Visit weekdays between 6-10 p.m. and Saturdays between 10 a.m.-5 p.m. to meet the team.",
      source_url: "https://www.henrystreet.org/programs/athletics/sports-programs/",
      cost_status: "free",
    },
    evidence: {
      quote: "Free activities like cooking and martial arts classes",
      url: "https://www.henrystreet.org/programs/athletics/sports-programs/",
    },
  },
  {
    listing: {
      dedupe_key: "abada:teens",
      title: "Capoeira for teens (13 to 19)",
      category_slug: "class",
      discipline_slug: "capoeira",
      ages_text: "Ages 13 to 19",
      eligibility: "Teens 13 to 19",
      venue: "Abadá-Capoeira NYC",
      description: "Teens train for free every day. See the school's schedule for class times.",
      source_url: "https://www.abada.org/",
      cost_status: "free",
    },
    evidence: { quote: "Teens 13-19 train for free every day", url: "https://www.abada.org/" },
  },
  {
    listing: {
      dedupe_key: "cops-and-kids:bronx-boxing",
      title: "Youth boxing at the NYC Cops & Kids gym (Bronx)",
      category_slug: "program",
      discipline_slug: "boxing",
      description:
        "Free youth boxing program in the Bronx. Check with the gym for its current schedule.",
      ages_text: "Ages 12 to 21",
      venue: "NYC Cops & Kids Boxing",
      address: "1761 Walton Ave, Bronx, NY 10451",
      borough: "Bronx",
      neighborhood: null,
      source_url: "https://www.copsandkidsboxing.com/",
      cost_status: "free",
    },
    evidence: {
      quote:
        "NYC Cops & Kids currently offers 3 free boxing and fitness locations, as well as a tutoring spaces, in NYC for teens aged 12-21",
      url: "https://www.copsandkidsboxing.com/home",
    },
  },
];

export function curated(
  fetchImpl: FetchImpl = fetch,
  entries: ReadonlyArray<CuratedEntry> = CURATED,
): Source {
  const def: SourceDef = {
    slug: "curated",
    name: "Reviewed by the directory team",
    url: "https://github.com/columbiasoftwaresolutions/santas-knights-events",
    method: "curated",
    cadence: "daily",
  };
  return {
    def,
    collect: async (): Promise<SourceResult> => {
      const fetchedAt = new Date().toISOString();
      const pageText = new Map<string, string | null>();
      const load = async (url: string) => {
        if (!pageText.has(url)) {
          pageText.set(
            url,
            await fetchText(url, { fetchImpl })
              .then(htmlToText)
              .catch(() => null),
          );
        }
        return pageText.get(url)!;
      };

      const candidates = [];
      // Sequential on purpose: one polite request per page, and a shared page cache.
      for (const entry of entries) {
        let listing = listingPayload(entry.listing);
        const evidence = [];
        if (entry.evidence) {
          // oxlint-disable-next-line no-await-in-loop -- sequential and cached by design
          const text = await load(entry.evidence.url);
          if (text && containsQuote(text, entry.evidence.quote)) {
            evidence.push({
              quote: entry.evidence.quote,
              url: entry.evidence.url,
              captured_at: fetchedAt,
              method: "curated" as const,
              supports_cost_status: listing.cost_status,
            });
          } else {
            // The page no longer says it, or could not be read: fail closed.
            listing = { ...listing, cost_status: "unverified" };
          }
        }
        candidates.push({ listing, occurrences: [], evidence });
      }
      return { fetched: entries.length, rejected: 0, candidates, fetchedAt };
    },
  };
}
