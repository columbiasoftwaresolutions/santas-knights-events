import { addDays } from "@/lib/dates";
import type { CostStatus } from "./schema";

// Invented listings for the prototype. Venues, times and quotes are not real.
// Days are offsets from today so the week always looks current.

type Row = [
  offset: number,
  start: string,
  end: string,
  title: string,
  discipline: string,
  borough: string,
  neighborhood: string,
  venue: string,
  ages: string,
  cost: CostStatus,
  quote: string,
  source: string,
];

const ROWS: Row[] = [
  [0, "18:00", "19:00", "Open mat judo", "Judo", "Manhattan", "Harlem", "Riverside Community Center", "13 and up", "free", "All mat sessions are free for NYC residents.", "Center website"],
  [0, "19:30", "20:30", "Evening tai chi", "Tai chi", "Brooklyn", "Sunset Park", "Sunset Park library, meeting room", "Adults", "free", "Free tai chi, no registration needed.", "Library calendar"],
  [1, "16:00", "17:00", "Youth boxing fundamentals", "Boxing", "Bronx", "Mott Haven", "Beacon center gym", "Ages 8 to 14", "free", "Beacon programs are no-cost to youth.", "City youth directory"],
  [1, "17:30", "18:30", "Self-defense basics", "Self-defense", "Brooklyn", "Bed-Stuy", "Branch library auditorium", "Teens and adults", "free_with_registration", "Free. Register online, space is limited.", "Library calendar"],
  [1, "19:00", "20:00", "Kids karate, first class", "Karate", "Queens", "Astoria", "Astoria Karate Studio", "Ages 6 to 12", "free_trial_only", "Your first class is free. Monthly membership applies after.", "Studio website"],
  [2, "12:00", "13:00", "Lunchtime qigong", "Tai chi", "Manhattan", "Midtown", "Plaza lawn", "All ages", "free", "Free outdoor fitness classes, weather permitting.", "Parks feed"],
  [2, "18:30", "19:45", "Muay Thai intro", "Muay Thai", "Manhattan", "Bryant Park area", "Terrace lawn", "16 and up", "free_with_registration", "Free sessions taught by local studios. RSVP required.", "Park calendar"],
  [3, "17:00", "18:15", "Taekwondo for beginners", "Taekwondo", "Staten Island", "St. George", "Community recreation hall", "Ages 7 to 17", "sliding_scale", "Pay what you can. Nobody is turned away.", "Hall website"],
  [3, "19:00", "20:30", "Brazilian jiu-jitsu drop-in", "Jiu-jitsu", "Brooklyn", "Williamsburg", "Northside Grappling Room", "18 and up", "unverified", "Drop-in rates listed on request.", "Studio website"],
  [4, "10:00", "11:00", "Saturday family kung fu", "Kung fu", "Queens", "Flushing", "Flushing Meadows pavilion", "Families", "free", "Free family classes through the fall.", "Parks feed"],
  [4, "13:00", "14:30", "Women's self-defense workshop", "Self-defense", "Manhattan", "Washington Heights", "Neighborhood center, room 2", "Women and girls 14+", "free_with_registration", "Free workshop. Sign up at the front desk.", "Center website"],
  [5, "11:00", "12:00", "Sunday judo for kids", "Judo", "Brooklyn", "Crown Heights", "Crown Heights youth club", "Ages 5 to 12", "free", "Sunday judo is free for members of the youth club, and membership is free.", "Club website"],
  [5, "15:00", "16:30", "Stick fighting and fitness", "Eskrima", "Bronx", "Fordham", "Fordham plaza stage", "16 and up", "free_trial_only", "Try one session free.", "Studio website"],
  [6, "18:00", "19:00", "Boxing conditioning", "Boxing", "Queens", "Jamaica", "Jamaica rec center, studio B", "Adults", "free", "Free fitness class, drop in.", "Parks feed"],
];

export function sampleRows(today: string) {
  return ROWS.map(
    ([offset, startTime, endTime, title, discipline, borough, neighborhood, venue, ages, costStatus, quote, source], i) => ({
      id: `sample-${String(i + 1).padStart(3, "0")}`,
      title,
      discipline,
      description: "",
      borough,
      neighborhood,
      venue,
      day: addDays(today, offset),
      startTime,
      endTime,
      ages,
      costStatus,
      evidence: {
        quote,
        source,
        url: "https://example.invalid/sample",
        checkedOn: addDays(today, -((i % 4) + 1)),
      },
    }),
  );
}
