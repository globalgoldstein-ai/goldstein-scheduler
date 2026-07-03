-- Goldstein Scheduler | Phase 2 | Session 1 | Build 1 | 2026-07-03 12:22 ET | schema + RLS

-- SWAPS — deltas over the default schedule. Owned by the receiving household.
create table swaps (
  id uuid primary key default gen_random_uuid(),
  date_start date not null,
  date_end date not null,
  receiving_parent text not null check (receiving_parent in ('aaron_rebecca','lisa')),
  default_parent  text not null check (default_parent  in ('aaron_rebecca','lisa')),
  status text not null default 'proposed' check (status in ('proposed','agreed','needs_discussion')),
  proposed_by text not null check (proposed_by in ('aaron','rebecca','lisa')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_end >= date_start),
  check (receiving_parent <> default_parent)
);

-- EVENTS — holidays, school dates, trips, one-offs. category drives conflict detection.
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kid text not null default 'zoe' check (kid in ('both','noah','zoe')),
  category text not null default 'other' check (category in ('holiday','school','trip','other')),
  date_start date not null,
  date_end date not null,
  status text not null default 'proposed' check (status in ('proposed','agreed','needs_discussion')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_end >= date_start)
);

-- AUDIT_LOG — append-only. One row per create/edit/delete.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  actor text not null check (actor in ('aaron','rebecca','lisa')),
  action text not null check (action in ('create','edit','delete')),
  entity_type text not null check (entity_type in ('swap','event')),
  entity_id uuid not null,
  before jsonb,
  after jsonb
);

-- updated_at auto-touch
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger swaps_updated  before update on swaps  for each row execute function set_updated_at();
create trigger events_updated before update on events for each row execute function set_updated_at();

-- indexes for date-range / audit lookups
create index swaps_dates  on swaps  (date_start, date_end);
create index events_dates on events (date_start, date_end);
create index audit_entity on audit_log (entity_type, entity_id);

-- RLS: on now, permissive for anon (no auth at launch). Swap these policies when auth lands.
alter table swaps     enable row level security;
alter table events    enable row level security;
alter table audit_log enable row level security;

create policy anon_all_swaps  on swaps  for all to anon using (true) with check (true);
create policy anon_all_events on events for all to anon using (true) with check (true);
-- audit stays append-only even under anon: insert + select, no update/delete policy = those are denied
create policy anon_insert_audit on audit_log for insert to anon with check (true);
create policy anon_select_audit on audit_log for select to anon using (true);
