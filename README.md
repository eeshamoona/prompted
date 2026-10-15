# Prompted

A daily creative warm-up: one curated, no-right-answer prompt a day. An AI nudge helps when you're stuck, and the answer stays yours.

## Run it locally

1. Copy `.env.example` to `.env.local` and fill in each value (comments say where each comes from).
2. In the Supabase SQL Editor, run `supabase/001_v2_schema.sql`, then `supabase/002_seed_prompts.sql`.
3. `npm install`, then `npm run dev`, and open http://localhost:3000.

## How it fits together

- **Today** (`/`): the featured prompt, the same for everyone on a given local date, with "Another prompt" (swaps are recorded to test how much choice people want).
- **Write** (`/write`): nudge text is tracked character by character and shown in a softer color.
- **Finished** (`/done/[id]`): streak, days this week, and a reader's note in your chosen persona (no scores).
- **Your book** (`/book`): every answer, newest first.
- **Settings**: reader persona, evening reminder (off by default), timezone.
- **Reminder** (`/api/cron/reminder`): runs once each evening on Vercel (00:00 UTC). Only emails addresses in `EMAIL_ALLOWLIST`.

## Data

New `v2_` tables sit alongside v1's tables, which are untouched. Row-level security limits each person to their own rows.
