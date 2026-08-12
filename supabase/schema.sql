-- ============================================================
-- Live Voting System — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Project → SQL Editor → New query → paste → Run)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Election settings (single row) ----------
create table if not exists election_settings (
  id int primary key default 1,
  title text not null default 'Election 2026',
  is_open boolean not null default true,
  constraint single_row check (id = 1)
);
insert into election_settings (id, title, is_open)
  values (1, 'Election 2026', true)
  on conflict (id) do nothing;

-- ---------- Aspirants (candidates) ----------
create table if not exists aspirants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null,
  category text,
  sex text check (sex in ('Male', 'Female')),
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------- Voters (access codes issued by admin) ----------
create table if not exists voters (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text,                -- optional: voter's name/ID, admin-only reference
  is_used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Votes ----------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null references voters(id) on delete cascade,
  aspirant_id uuid not null references aspirants(id) on delete cascade,
  position text not null,
  created_at timestamptz not null default now(),
  unique (voter_id, position)  -- one vote per position per voter
);

create index if not exists idx_votes_aspirant on votes(aspirant_id);
create index if not exists idx_votes_position on votes(position);

-- ============================================================
-- Row Level Security
-- All writes (creating aspirants, generating codes, casting votes)
-- go through server-side API routes using the SERVICE ROLE key,
-- which bypasses RLS. The anon (public/browser) key is only ever
-- used for READ-ONLY access needed to render public pages.
-- ============================================================

alter table election_settings enable row level security;
alter table aspirants enable row level security;
alter table voters enable row level security;
alter table votes enable row level security;

-- Public can read election settings (title, open/closed)
create policy "public read election_settings"
  on election_settings for select
  to anon
  using (true);

-- Public can read aspirants (needed for ballot + results pages)
create policy "public read aspirants"
  on aspirants for select
  to anon
  using (true);

-- Public can read votes (aggregate counts only, no personal data lives here)
create policy "public read votes"
  on votes for select
  to anon
  using (true);

-- Voters table is NEVER readable by the public (protects access codes)
-- No policy = no access for anon. Only service role (server) can touch it.

-- ============================================================
-- Realtime: broadcast changes on votes so the results page
-- updates live without polling.
-- ============================================================
alter publication supabase_realtime add table votes;

-- ============================================================
-- Storage: a public bucket for aspirant photos.
-- Uploads happen server-side (service role), so no insert/update
-- policy is needed for anon — only a read policy so photos display.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('aspirant-photos', 'aspirant-photos', true)
  on conflict (id) do nothing;

create policy "public read aspirant photos"
  on storage.objects for select
  to anon
  using (bucket_id = 'aspirant-photos');
