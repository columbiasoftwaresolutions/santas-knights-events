import { Schema } from "effect";

import { Borough, CostStatus, isFreeStatus } from "@/lib/listings/schema";
import { HttpUrl } from "@/lib/listings/url";

// What a source adapter produces. Field names match the `ingest_listing` SQL
// function's payload, so a candidate goes to the database as it is. The checks
// here mirror the database rules so a bad candidate is rejected and counted
// before it can roll back a whole run.

const NonBlank = Schema.String.check(
  Schema.makeFilter((s: string) => s.trim() !== "" || "Must not be blank"),
);

// An instant with an explicit offset, e.g. 2026-11-11T18:30:00-05:00.
const Instant = Schema.String.check(
  Schema.makeFilter(
    (s: string) =>
      (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(s) &&
        !Number.isNaN(Date.parse(s))) ||
      "Expected an ISO instant with an offset",
  ),
);

export const SOURCE_METHODS = ["feed", "html", "curated"] as const;
export const SourceMethod = Schema.Literals(SOURCE_METHODS);

export const ListingPayload = Schema.Struct({
  dedupe_key: NonBlank,
  title: NonBlank,
  description: Schema.String,
  category_slug: NonBlank,
  discipline_slug: Schema.NullOr(Schema.String),
  ages_text: Schema.NullOr(Schema.String),
  eligibility: Schema.NullOr(Schema.String),
  venue: Schema.NullOr(Schema.String),
  address: Schema.NullOr(Schema.String),
  borough: Schema.NullOr(Borough),
  neighborhood: Schema.NullOr(Schema.String),
  latitude: Schema.NullOr(Schema.Number),
  longitude: Schema.NullOr(Schema.Number),
  schedule_text: Schema.NullOr(Schema.String),
  cost_status: CostStatus,
  registration_url: Schema.NullOr(HttpUrl),
  registration_notes: Schema.NullOr(Schema.String),
  source_url: HttpUrl,
  external_id: Schema.NullOr(Schema.String),
  status: Schema.Literals(["active", "hidden"]),
});
export type ListingPayload = typeof ListingPayload.Type;

export const OccurrencePayload = Schema.Struct({
  starts_at: Instant,
  ends_at: Schema.NullOr(Instant),
  source_occurrence_key: Schema.NullOr(Schema.String),
  cancelled: Schema.Boolean,
});
export type OccurrencePayload = typeof OccurrencePayload.Type;

export const EvidencePayload = Schema.Struct({
  quote: NonBlank,
  url: HttpUrl,
  captured_at: Instant,
  method: SourceMethod,
  supports_cost_status: CostStatus,
});
export type EvidencePayload = typeof EvidencePayload.Type;

export const Candidate = Schema.Struct({
  listing: ListingPayload,
  occurrences: Schema.Array(OccurrencePayload),
  evidence: Schema.Array(EvidencePayload),
}).check(
  Schema.makeFilter(
    (c) =>
      !isFreeStatus(c.listing.cost_status) ||
      c.evidence.some((e) => e.supports_cost_status === c.listing.cost_status) ||
      "A free candidate needs evidence that supports that exact status",
  ),
  Schema.makeFilter(
    (c) =>
      c.occurrences.every(
        (o) => o.ends_at === null || Date.parse(o.ends_at) > Date.parse(o.starts_at),
      ) || "An occurrence must end after it starts",
  ),
);
export type Candidate = typeof Candidate.Type;

export interface SourceDef {
  slug: string;
  name: string;
  url: string;
  method: (typeof SOURCE_METHODS)[number];
  cadence: string;
}

export class SourceError extends Schema.TaggedError<SourceError>()("SourceError", {
  source: Schema.String,
  stage: Schema.Literals(["config", "fetch", "parse", "write"]),
  message: Schema.String,
}) {}

// What an adapter hands back. `rejected` counts rows it looked at and dropped on
// purpose (not martial arts, no usable date), so a run can report what it skipped.
export interface SourceResult {
  fetched: number;
  rejected: number;
  candidates: ReadonlyArray<unknown>;
  // The moment the data was fetched, used as captured_at for page-level quotes.
  fetchedAt: string;
  incomplete?: boolean;
}

export interface Source {
  def: SourceDef;
  // Raw, undecoded candidates. The runner decodes them with `Candidate`.
  collect: () => Promise<SourceResult>;
}
