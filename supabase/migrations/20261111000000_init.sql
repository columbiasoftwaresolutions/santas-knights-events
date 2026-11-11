-- Run locally with Supabase CLI before applying to a hosted project.
-- No listing seeds: source availability is not proof of current free classes.
begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.borough as enum
  ('Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island');
create type public.cost_status as enum
  ('free', 'free_with_registration', 'free_trial_only', 'sliding_scale', 'unverified');
create type public.listing_status as enum ('active', 'stale', 'hidden');
create type public.source_method as enum ('feed', 'html', 'curated');

-- Deliberately conservative DNS-host subset of the application's WHATWG URL
-- parser (src/lib/listings/url.ts is the stricter source of truth). See
-- docs/effect-architecture.md and the shared test corpus.
create function public.is_http_url(value text) returns boolean
language sql immutable strict parallel safe set search_path = pg_catalog as $$
  select case when value ~ '^https?://([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}(:[0-9]{1,5})?([/?#][^[:space:]\\]*)?$'
    and value !~ '[[:space:]\\]'
    and lower(substring(value from '^https?://([^/?#:]+)')) !~ '(^|\.)localhost$'
  then coalesce(substring(value from '^https?://[^/?#:]+:([0-9]+)')::integer <= 65535, true)
  else false end;
$$;
revoke all on function public.is_http_url(text) from public, anon, authenticated;
grant execute on function public.is_http_url(text) to service_role;

create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique check (btrim(name) <> '')
);
create table public.disciplines (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique check (btrim(name) <> '')
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  url text not null check (public.is_http_url(url)),
  method public.source_method not null,
  cadence text not null default 'manual',
  enabled boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.sources is
  'Public provenance registry only. Never store credentials, private headers or operational errors here.';
comment on column public.sources.verified_at is
  'When the source transport/adapter was checked; does not verify any listing price.';

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  description text not null default '',
  category_slug text not null references public.categories(slug),
  discipline_slug text references public.disciplines(slug),
  age_min smallint check (age_min >= 0),
  age_max smallint check (age_max >= 0),
  ages_text text,
  eligibility text,
  venue text,
  address text,
  borough public.borough,
  neighborhood text,
  latitude double precision,
  longitude double precision,
  timezone text not null default 'America/New_York'
    check (timezone = 'America/New_York'),
  schedule_text text,
  cost_status public.cost_status not null default 'unverified',
  registration_url text check (public.is_http_url(registration_url)),
  registration_notes text,
  source_id uuid not null references public.sources(id),
  source_url text not null check (public.is_http_url(source_url)),
  external_id text,
  dedupe_key text not null check (btrim(dedupe_key) <> ''),
  discovered_by text not null default 'deterministic'
    check (discovered_by in ('deterministic', 'curated', 'ai_assisted')),
  status public.listing_status not null default 'hidden',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  -- Maintained by triggers below: it joins taxonomy names, which a generated column cannot.
  search_document tsvector,
  unique (source_id, dedupe_key),
  check (age_min is null or age_max is null or age_min <= age_max),
  check ((latitude is null) = (longitude is null)),
  check (latitude between -90 and 90 and longitude between -180 and 180),
  check (last_seen_at >= first_seen_at)
);
comment on column public.listings.dedupe_key is
  'Stable identity within one source (e.g. GUID), not a title/date hash. Cross-source duplicates require review.';
comment on column public.listings.last_verified_at is
  'Last actual cost/eligibility check. Fetching a page or seeing an ID again does not advance this timestamp.';
comment on column public.listings.schedule_text is
  'Source schedule context only; not executable recurrence. Zero or more materialized occurrences carry dates.';
comment on column public.listings.discovered_by is
  'Discovery provenance, not a claim of trust. ai_assisted is reserved; no AI ingestion is implemented.';
comment on column public.listings.ages_text is
  'Source wording for the current UI; null age bounds mean unknown, never inferred all-ages eligibility.';

create table public.listing_occurrences (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  source_occurrence_key text,
  cancelled boolean not null default false,
  last_seen_at timestamptz not null default now(),
  unique (listing_id, starts_at),
  check (ends_at is null or ends_at > starts_at)
);
comment on table public.listing_occurrences is
  'Only source-confirmed dated sessions; no invented recurrence. Interpret source local times in the listing timezone before storage.';

create table public.listing_evidence (
  id uuid primary key default gen_random_uuid(),
  -- Defer this FK too so evidence may precede its new parent in one transaction.
  listing_id uuid not null references public.listings(id) on delete cascade
    deferrable initially deferred,
  source_id uuid not null references public.sources(id),
  quote text not null check (btrim(quote) <> ''),
  url text not null check (public.is_http_url(url)),
  captured_at timestamptz not null,
  method public.source_method not null,
  supports_cost_status public.cost_status not null,
  unique (listing_id, url, captured_at, supports_cost_status)
);
comment on column public.listing_evidence.supports_cost_status is
  'Specific claim supported by this quote; only a matching claim satisfies the free-evidence invariant. Adapters must validate quote relevance.';
comment on column public.listing_evidence.captured_at is
  'When this quote was actually checked/captured, not source publication time or an automatic import heartbeat.';

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'partial', 'failed')),
  window_start timestamptz,
  window_end timestamptz,
  fetched_count integer not null default 0 check (fetched_count >= 0),
  matched_count integer not null default 0 check (matched_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  error text,
  check (finished_at is null or finished_at >= started_at),
  check ((status = 'running') = (finished_at is null)),
  check (window_start is null or window_end is null or window_end > window_start)
);
comment on table public.ingestion_runs is
  'Private operational records. Counts describe candidates/listings, not necessarily occurrences. Sanitize errors; no payloads, secrets or headers.';
comment on column public.ingestion_runs.window_end is
  'Exclusive snapshot bound. Reconcile disappearances only for a complete successful snapshot of this same window.';

create index listings_search_idx on public.listings using gin (search_document);
create index listings_title_trgm_idx on public.listings using gin (title extensions.gin_trgm_ops);
create index listings_filters_idx on public.listings
  (category_slug, borough, cost_status) where status = 'active';
create index listings_discipline_idx on public.listings (discipline_slug);
create index listings_neighborhood_idx on public.listings (borough, neighborhood);
create index listings_age_idx on public.listings (age_min, age_max);
create index listings_freshness_idx on public.listings (status, last_verified_at);
-- Simple bounding-box map queries, not a distance/radius index. No PostGIS dependency in this small NYC prototype.
create index listings_lat_lng_idx on public.listings (latitude, longitude)
  where latitude is not null and status = 'active';
create index occurrences_upcoming_idx on public.listing_occurrences (starts_at, listing_id)
  where not cancelled;
create unique index occurrences_source_key_idx on public.listing_occurrences (listing_id, source_occurrence_key)
  where source_occurrence_key is not null;
create index evidence_claim_idx on public.listing_evidence
  (listing_id, supports_cost_status, captured_at desc);
create index evidence_source_idx on public.listing_evidence (source_id);
create index ingestion_runs_source_idx on public.ingestion_runs (source_id, started_at desc);
create unique index ingestion_runs_one_running_idx on public.ingestion_runs (source_id)
  where status = 'running';

-- Search covers title, description, venue, neighborhood, borough, discipline and category.
create function public.refresh_listing_search() returns trigger
language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  NEW.search_document :=
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, concat_ws(' ', NEW.description,
      NEW.venue, NEW.neighborhood, NEW.borough::text,
      (select name from public.disciplines where slug = NEW.discipline_slug),
      (select name from public.categories where slug = NEW.category_slug))), 'B');
  return NEW;
end;
$$;
create trigger listings_refresh_search before insert or update on public.listings
  for each row execute function public.refresh_listing_search();

create function public.refresh_taxonomy_search() returns trigger
language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  if TG_TABLE_NAME = 'disciplines' then
    update public.listings set discipline_slug = discipline_slug where discipline_slug = NEW.slug;
  else
    update public.listings set category_slug = category_slug where category_slug = NEW.slug;
  end if;
  return null;
end;
$$;
create trigger disciplines_refresh_search after update of name on public.disciplines
  for each row execute function public.refresh_taxonomy_search();
create trigger categories_refresh_search after update of name on public.categories
  for each row execute function public.refresh_taxonomy_search();

create function public.assert_free_evidence(p_listing_id uuid) returns void
language plpgsql set search_path = pg_catalog, public as $$
declare
  v_cost public.cost_status;
  v_verified timestamptz;
begin
  select cost_status, last_verified_at into v_cost, v_verified
    from public.listings where id = p_listing_id;
  -- No parent during a cascading deletion: nothing left to protect.
  if not found then return; end if;
  if v_cost in ('free', 'free_with_registration') then
    if v_verified is null or not exists (
      select 1 from public.listing_evidence
        where listing_id = p_listing_id and supports_cost_status = v_cost
    ) then
      raise exception 'Listing % requires matching cost evidence and last_verified_at', p_listing_id
        using errcode = '23514';
    end if;
  end if;
end;
$$;

create function public.check_free_evidence() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
  if TG_TABLE_NAME = 'listings' then
    perform public.assert_free_evidence(NEW.id);
  else
    if TG_OP <> 'INSERT' then
      perform public.assert_free_evidence(OLD.listing_id);
    end if;
    if TG_OP <> 'DELETE' then
      perform public.assert_free_evidence(NEW.listing_id);
    end if;
  end if;
  return null;
end;
$$;
-- Cross-table CHECK constraints are unsafe; deferred triggers validate final
-- transaction state and allow inserting a listing and evidence in either order.
create constraint trigger listings_require_free_evidence
  after insert or update on public.listings deferrable initially deferred
  for each row execute function public.check_free_evidence();
create constraint trigger evidence_preserves_free_claim
  after insert or update or delete on public.listing_evidence deferrable initially deferred
  for each row execute function public.check_free_evidence();

-- Full normalized listing snapshot; omitted optional fields reset to defaults/null.
-- Identity and timestamps are controlled here, not taken from the JSON payload.
-- SECURITY INVOKER deliberately uses service_role's DML grants/RLS bypass; no
-- elevated owner privileges. A PostgREST RPC call commits all three writes together.
create function public.ingest_listing(
  p_listing jsonb, p_occurrences jsonb, p_evidence jsonb
) returns uuid
language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
  v_listing public.listings;
  v_id uuid;
  v_occurrence public.listing_occurrences;
  v_occurrence_id uuid;
  v_evidence public.listing_evidence;
  v_new_captured_at timestamptz;
  v_verified_at timestamptz;
begin
  if jsonb_typeof(p_listing) is distinct from 'object'
    or jsonb_typeof(p_occurrences) is distinct from 'array'
    or jsonb_typeof(p_evidence) is distinct from 'array' then
    raise exception 'Expected listing object, occurrences array and evidence array'
      using errcode = '22023';
  end if;
  v_listing := jsonb_populate_record(null::public.listings, p_listing);
  insert into public.listings (
    title, description, category_slug, discipline_slug, age_min, age_max,
    ages_text, eligibility, venue, address, borough, neighborhood, latitude,
    longitude, timezone, schedule_text, cost_status, registration_url,
    registration_notes, source_id, source_url, external_id, dedupe_key,
    discovered_by, status
  ) values (
    v_listing.title, coalesce(v_listing.description, ''), v_listing.category_slug,
    v_listing.discipline_slug, v_listing.age_min, v_listing.age_max,
    v_listing.ages_text, v_listing.eligibility, v_listing.venue, v_listing.address,
    v_listing.borough, v_listing.neighborhood, v_listing.latitude,
    v_listing.longitude, coalesce(v_listing.timezone, 'America/New_York'),
    v_listing.schedule_text, coalesce(v_listing.cost_status, 'unverified'),
    v_listing.registration_url, v_listing.registration_notes, v_listing.source_id,
    v_listing.source_url, v_listing.external_id, v_listing.dedupe_key,
    coalesce(v_listing.discovered_by, 'deterministic'), coalesce(v_listing.status, 'hidden')
  ) on conflict (source_id, dedupe_key) do update set
    title = excluded.title, description = excluded.description,
    category_slug = excluded.category_slug, discipline_slug = excluded.discipline_slug,
    age_min = excluded.age_min, age_max = excluded.age_max, ages_text = excluded.ages_text,
    eligibility = excluded.eligibility, venue = excluded.venue, address = excluded.address,
    borough = excluded.borough, neighborhood = excluded.neighborhood,
    latitude = excluded.latitude, longitude = excluded.longitude,
    timezone = excluded.timezone, schedule_text = excluded.schedule_text,
    cost_status = excluded.cost_status, registration_url = excluded.registration_url,
    registration_notes = excluded.registration_notes, source_url = excluded.source_url,
    external_id = excluded.external_id, discovered_by = excluded.discovered_by,
    status = excluded.status, last_seen_at = now()
  returning id, cost_status into v_id, v_listing.cost_status;

  -- Prefer stable source keys when available so a reschedule updates the same row.
  -- Omitted occurrences are preserved: a partial feed is not proof of cancellation.
  for v_occurrence in select * from jsonb_populate_recordset(
    null::public.listing_occurrences, p_occurrences
  ) loop
    v_occurrence_id := null;
    if v_occurrence.source_occurrence_key is not null then
      update public.listing_occurrences set
        starts_at = v_occurrence.starts_at, ends_at = v_occurrence.ends_at,
        cancelled = coalesce(v_occurrence.cancelled, false), last_seen_at = now()
      where listing_id = v_id and source_occurrence_key = v_occurrence.source_occurrence_key
      returning id into v_occurrence_id;
    end if;
    if v_occurrence_id is null then
      insert into public.listing_occurrences (
        listing_id, starts_at, ends_at, source_occurrence_key, cancelled
      ) values (
        v_id, v_occurrence.starts_at, v_occurrence.ends_at,
        v_occurrence.source_occurrence_key, coalesce(v_occurrence.cancelled, false)
      ) on conflict (listing_id, starts_at) do update set
        ends_at = excluded.ends_at,
        source_occurrence_key = coalesce(listing_occurrences.source_occurrence_key, excluded.source_occurrence_key),
        cancelled = excluded.cancelled, last_seen_at = now()
      where listing_occurrences.source_occurrence_key is null
        or excluded.source_occurrence_key is null
        or listing_occurrences.source_occurrence_key = excluded.source_occurrence_key
      returning id into v_occurrence_id;
      if v_occurrence_id is null then
        raise exception 'Conflicting source occurrence keys at the same start time'
          using errcode = '22023';
      end if;
    end if;
  end loop;

  for v_evidence in select * from jsonb_populate_recordset(
    null::public.listing_evidence, p_evidence
  ) loop
    v_new_captured_at := null;
    insert into public.listing_evidence (
      listing_id, source_id, quote, url, captured_at, method, supports_cost_status
    ) values (
      v_id, coalesce(v_evidence.source_id, v_listing.source_id), v_evidence.quote,
      v_evidence.url, v_evidence.captured_at, v_evidence.method, v_evidence.supports_cost_status
    ) on conflict (listing_id, url, captured_at, supports_cost_status) do nothing
    returning captured_at into v_new_captured_at;
    if v_new_captured_at is null then
      -- A reused evidence identity with changed content is not an exact duplicate.
      if not exists (
        select 1 from public.listing_evidence where listing_id = v_id
          and url = v_evidence.url and captured_at = v_evidence.captured_at
          and supports_cost_status = v_evidence.supports_cost_status
          and quote = v_evidence.quote and method = v_evidence.method
          and source_id = coalesce(v_evidence.source_id, v_listing.source_id)
      ) then
        raise exception 'Evidence identity reused with different content'
          using errcode = '22023';
      end if;
    elsif v_evidence.supports_cost_status = v_listing.cost_status then
      v_verified_at := greatest(v_verified_at, v_new_captured_at);
    end if;
  end loop;
  if v_verified_at is not null then
    update public.listings
      set last_verified_at = greatest(last_verified_at, v_verified_at) where id = v_id;
  end if;
  -- Deferred triggers check the final transaction state, including missing evidence.
  return v_id;
end;
$$;

alter table public.categories enable row level security;
alter table public.disciplines enable row level security;
alter table public.sources enable row level security;
alter table public.listings enable row level security;
alter table public.listing_occurrences enable row level security;
alter table public.listing_evidence enable row level security;
alter table public.ingestion_runs enable row level security;

create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy disciplines_read on public.disciplines for select to anon, authenticated using (true);
create policy sources_read on public.sources for select to anon, authenticated using (true);
create policy listings_read on public.listings for select to anon, authenticated
  using (status = 'active');
create policy occurrences_read on public.listing_occurrences for select to anon, authenticated
  using (not cancelled and exists (
    select 1 from public.listings l where l.id = listing_id
      and l.status = 'active'
  ));
create policy evidence_read on public.listing_evidence for select to anon, authenticated
  using (exists (
    select 1 from public.listings l where l.id = listing_id
      and l.status = 'active'
  ));
-- No public write policies, and no public ingestion_runs policy/grant.
-- Revoke Supabase default grants, including TRUNCATE (which bypasses row triggers).
revoke all on table public.categories, public.disciplines, public.sources,
  public.listings, public.listing_occurrences, public.listing_evidence, public.ingestion_runs
  from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant select on table public.categories, public.disciplines, public.sources,
  public.listings, public.listing_occurrences, public.listing_evidence to anon, authenticated;
grant select, insert, update, delete on table public.categories, public.disciplines,
  public.sources, public.listings, public.listing_occurrences, public.listing_evidence,
  public.ingestion_runs to service_role;
revoke all on function public.ingest_listing(jsonb, jsonb, jsonb), public.assert_free_evidence(uuid),
  public.check_free_evidence() from public, anon, authenticated;
grant execute on function public.ingest_listing(jsonb, jsonb, jsonb), public.assert_free_evidence(uuid),
  public.check_free_evidence() to service_role;
-- service_role bypasses RLS in Supabase; the table owner/admin can also migrate
-- or repair data. The service gets DML, never TRUNCATE or trigger-disabling DDL.

revoke all on function public.refresh_listing_search(), public.refresh_taxonomy_search()
  from public, anon, authenticated;
grant execute on function public.refresh_listing_search(), public.refresh_taxonomy_search()
  to service_role;

insert into public.categories (slug, name) values
  ('class', 'Class'), ('open-mat', 'Open mat'), ('event', 'Event'),
  ('program', 'Program'), ('trial', 'Trial');
insert into public.disciplines (slug, name) values
  ('tai-chi', 'Tai chi'), ('self-defense', 'Self-defense'), ('boxing', 'Boxing'),
  ('muay-thai', 'Muay Thai'), ('kickboxing', 'Kickboxing'), ('karate', 'Karate'),
  ('judo', 'Judo'), ('brazilian-jiu-jitsu', 'Brazilian jiu-jitsu'),
  ('mixed-martial-arts', 'Mixed martial arts');

commit;
