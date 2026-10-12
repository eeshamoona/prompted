-- Prompted v2: read the experiments. Paste any one of these into the Supabase SQL editor.

-- 1) Main objective: days written per week, per person (target 5 of 7).
select user_id, date_trunc('week', entry_date)::date as week, count(distinct entry_date) as days_written
from public.v2_entries
group by 1, 2
order by 2 desc, 3 desc;

-- 2) Choice test: how often the featured prompt gets swapped, by category of the prompt swapped away from.
select p.category,
       count(*) filter (where e.kind = 'swapped') as swaps,
       count(*) filter (where e.kind = 'finished') as finishes
from public.v2_prompt_events e
join public.v2_prompts p on p.id = e.prompt_id
group by 1
order by swaps desc;

-- 3) "Want another?" test: taps after finishing vs. finishes.
select count(*) filter (where kind = 'want_another') as want_another_taps,
       count(*) filter (where kind = 'finished') as finishes
from public.v2_prompt_events;

-- 4) Feeling good after: mood answers.
select mood, count(*) from public.v2_entries where mood is not null group by 1 order by 2 desc;

-- 5) Rereads and part twos.
select count(*) filter (where reread_count > 0) as reread_entries,
       count(*) filter (where reply_text is not null) as part_twos,
       count(*) filter (where shared) as shared_entries,
       count(*) as entries
from public.v2_entries;
