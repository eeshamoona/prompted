-- Prompted v2: measure the two remaining objectives, and ask about reminders after the first entry.
-- Run once in the Supabase SQL editor (after 001 and 002).

-- "I feel good after writing": optional one-tap answer on the Finished screen.
alter table public.v2_entries
  add column if not exists mood text check (mood in ('better', 'same', 'not_really')),
  -- "I reread old answers": counted when an entry is opened on a later day than it was written.
  add column if not exists reread_count int not null default 0,
  add column if not exists last_reread_on date;

-- Whether we've already offered the morning reminder (so we only ask once).
alter table public.v2_profiles
  add column if not exists reminder_asked boolean not null default false;
