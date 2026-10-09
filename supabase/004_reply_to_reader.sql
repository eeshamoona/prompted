-- Prompted v2: "Reply to your reader". The reader's question becomes part two of an answer.
-- Run once in the Supabase SQL editor (after 001-003).
alter table public.v2_entries
  add column if not exists reply_question text,
  add column if not exists reply_text text,
  add column if not exists reply_ai_spans jsonb not null default '[]',
  add column if not exists reply_reaction text,
  add column if not exists replied_at timestamptz;
