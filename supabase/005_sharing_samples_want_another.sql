-- Prompted v2: opt-in sharing, labeled sample answers, and the "Want another?" test.
-- Run once in the Supabase SQL editor (after 001-004).

-- Sharing is off unless you choose it, per answer.
alter table public.v2_entries add column if not exists shared boolean not null default false;

-- The name shown when you share (optional; otherwise "A fellow writer").
alter table public.v2_profiles add column if not exists display_name text
  check (display_name is null or char_length(display_name) <= 40);

-- AI-written sample answers, always labeled "Sample" in the app.
create table if not exists public.v2_sample_answers (
  id bigint generated always as identity primary key,
  prompt_id bigint not null references public.v2_prompts (id) on delete cascade,
  author_label text not null,
  title text,
  text text not null,
  created_at timestamptz not null default now(),
  unique (prompt_id, author_label)
);
alter table public.v2_sample_answers enable row level security;
-- No policies on purpose: read only through v2_answers_for_prompt(), written by the server.

-- Count taps on "Want another prompt?" after finishing.
alter table public.v2_prompt_events drop constraint if exists v2_prompt_events_kind_check;
alter table public.v2_prompt_events add constraint v2_prompt_events_kind_check
  check (kind in ('swapped', 'started', 'finished', 'want_another'));

-- Other people's answers to a prompt. Returns nothing until the caller has answered that prompt,
-- so you always write your own take before you can read anyone else's.
create or replace function public.v2_answers_for_prompt(p_prompt_id bigint)
returns table (
  answer_kind text,
  author text,
  answer_title text,
  answer_text text,
  answer_spans jsonb,
  answer_own_pct numeric,
  answered_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select * from (
    select 'shared'::text, coalesce(nullif(trim(p.display_name), ''), 'A fellow writer'),
           null::text, e.text, e.ai_spans, e.own_percentage, e.created_at
    from public.v2_entries e
    left join public.v2_profiles p on p.user_id = e.user_id
    where e.prompt_id = p_prompt_id
      and e.shared
      and e.user_id <> auth.uid()
    union all
    select 'sample'::text, s.author_label, s.title, s.text, '[]'::jsonb, null::numeric, s.created_at
    from public.v2_sample_answers s
    where s.prompt_id = p_prompt_id
  ) answers
  where exists (
    select 1 from public.v2_entries mine
    where mine.user_id = auth.uid() and mine.prompt_id = p_prompt_id
  )
  order by 1 desc, 7 desc
  limit 20;
$$;

revoke all on function public.v2_answers_for_prompt(bigint) from public, anon;
grant execute on function public.v2_answers_for_prompt(bigint) to authenticated;
