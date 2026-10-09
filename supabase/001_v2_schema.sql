-- Prompted v2 schema. Adds new v2_ tables alongside v1's tables (v1 is untouched).
-- Run once in the Supabase SQL editor, then run 002_seed_prompts.sql.

-- Prompts: the curated daily rotation
create table if not exists public.v2_prompts (
  id bigint generated always as identity primary key,
  v1_id bigint,
  text text not null,
  category text not null check (category in ('Imagine','Invent','Adventure','Pretend','Cozy','Grateful','Reflect')),
  rotation int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists v2_prompts_rotation_idx on public.v2_prompts (rotation);

-- Profiles: per-person settings. Reminders are OFF unless the person turns them on.
create table if not exists public.v2_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  persona text not null default 'muse' check (persona in ('muse','cheerleader','coach','critic','editor','guru')),
  timezone text not null default 'America/Chicago',
  reminder_enabled boolean not null default false,
  reminder_hour int not null default 8 check (reminder_hour between 0 and 23),
  last_reminded_on date,
  created_at timestamptz not null default now()
);

-- Entries: one row per finished answer
create table if not exists public.v2_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id bigint not null references public.v2_prompts (id),
  entry_date date not null,               -- the person's local date
  text text not null,
  ai_spans jsonb not null default '[]',   -- [[start, end], ...] character ranges that came from a nudge
  word_count int not null default 0,
  nudge_count int not null default 0,
  own_percentage numeric(5,2) not null default 100,
  elapsed_seconds int not null default 0,
  persona text,
  reaction text,
  created_at timestamptz not null default now()
);
create index if not exists v2_entries_user_date_idx on public.v2_entries (user_id, entry_date desc);

-- Prompt events: powers the "how much choice" test (shown / swapped)
create table if not exists public.v2_prompt_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id bigint not null references public.v2_prompts (id),
  event_date date not null,
  kind text not null check (kind in ('swapped','started','finished')),
  created_at timestamptz not null default now()
);
create index if not exists v2_prompt_events_user_idx on public.v2_prompt_events (user_id, event_date);

-- Row-level security: everyone can read active prompts; people only touch their own rows.
alter table public.v2_prompts enable row level security;
alter table public.v2_profiles enable row level security;
alter table public.v2_entries enable row level security;
alter table public.v2_prompt_events enable row level security;

drop policy if exists "prompts readable" on public.v2_prompts;
create policy "prompts readable" on public.v2_prompts for select using (active);

drop policy if exists "own profile" on public.v2_profiles;
create policy "own profile" on public.v2_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own entries" on public.v2_entries;
create policy "own entries" on public.v2_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own events" on public.v2_prompt_events;
create policy "own events" on public.v2_prompt_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
