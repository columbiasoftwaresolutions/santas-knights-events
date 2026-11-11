import { curated } from "./sources/curated";
import { nycAgingOac } from "./sources/nyc-aging-oac";
import { parksEvents } from "./sources/parks-events";
import { parksRecCenters } from "./sources/parks-rec-centers";
import type { Source } from "./types";

// Every source the cron route may run, by slug.
export const SOURCES: Record<string, () => Source> = {
  curated: () => curated(),
  "parks-events": () => parksEvents(),
  "nyc-aging-oac": () => nycAgingOac(),
  "parks-rec-centers": () => parksRecCenters,
};
