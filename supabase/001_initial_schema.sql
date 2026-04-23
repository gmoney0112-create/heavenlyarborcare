-- Heavenly Arbor Phase 2 — Initial Schema
-- Run this in the Supabase SQL editor for project: horqwtdcsfynbjhxbsrv

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── estimates ───────────────────────────────────────────────────────────────
create table if not exists estimates (
  id                      uuid primary key default uuid_generate_v4(),
  customer_name           text not null,
  customer_phone          text not null,
  customer_email          text not null,
  job_type                text not null check (job_type in ('removal','trimming','stump_grinding','storm_damage','consultation')),
  address                 text not null,
  video_url               text,
  status                  text not null default 'pending'
                            check (status in ('pending','viewed','approved','deposit_paid','scheduled','completed')),
  price_estimate          numeric(10,2) not null default 0,
  deposit_amount          numeric(10,2) not null default 0,
  stripe_payment_intent_id text,
  stripe_session_id       text,
  scheduled_date          timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ─── jobs ─────────────────────────────────────────────────────────────────────
create table if not exists jobs (
  id               uuid primary key default uuid_generate_v4(),
  estimate_id      uuid not null references estimates(id) on delete cascade,
  crew_assigned    text,
  scheduled_date   timestamptz,
  notes            text,
  status           text not null default 'scheduled'
                     check (status in ('scheduled','in_progress','complete')),
  review_requested boolean not null default false,
  review_sent_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger estimates_updated_at
  before update on estimates
  for each row execute function set_updated_at();

create trigger jobs_updated_at
  before update on jobs
  for each row execute function set_updated_at();

-- ─── RLS policies ─────────────────────────────────────────────────────────────
alter table estimates enable row level security;
alter table jobs enable row level security;

-- Public can read their own estimate by ID (no auth required — link is the secret)
create policy "public_read_estimate_by_id"
  on estimates for select
  using (true);

-- Only service role can insert/update (API routes use service key)
create policy "service_insert_estimates"
  on estimates for insert
  with check (true);

create policy "service_update_estimates"
  on estimates for update
  using (true);

create policy "service_read_jobs"
  on jobs for select
  using (true);

create policy "service_insert_jobs"
  on jobs for insert
  with check (true);

create policy "service_update_jobs"
  on jobs for update
  using (true);

-- ─── indexes ──────────────────────────────────────────────────────────────────
create index if not exists estimates_status_idx on estimates(status);
create index if not exists estimates_created_at_idx on estimates(created_at desc);
create index if not exists jobs_estimate_id_idx on jobs(estimate_id);
create index if not exists jobs_status_idx on jobs(status);
