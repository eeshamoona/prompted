# Deploying Prompted v2 to writeprompted.com

**Goal:** v2 at `www.writeprompted.com`; v1 kept online at `v1.writeprompted.com` to show the redesign;
`support@writeprompted.com` email untouched.

**Today:** v1 is live at www.writeprompted.com on Vercel. The domain's DNS is managed in Vercel.

## 0. Before you start (Supabase SQL editor)

Make sure every file in `supabase/` has been run once, in order: `001` → `005`.
(`005` adds sharing, sample answers and the "Want another?" test; Settings can't save until it runs.)

## 1. Put the code on GitHub (5 min)

1. On github.com, create a new **private** repository named `prompted`. Leave it empty (no README).
2. In Terminal, inside the PromptedV2 folder:
   ```
   git remote add origin https://github.com/eeshamoona/prompted.git
   git push -u origin main
   ```

## 2. Create the Vercel project (10 min)

1. Vercel → **Add New… → Project** → import `prompted`. Framework: Next.js (detected).
2. **Environment Variables**: copy every line from `.env.local`, plus:
   - `NEXT_PUBLIC_APP_URL` = `https://www.writeprompted.com`
3. **Deploy.** You get a `prompted-….vercel.app` address to test on.

## 3. Let sign-in links work on the new addresses (Supabase)

Authentication → **URL Configuration** → Redirect URLs, add:
- `https://www.writeprompted.com/auth/confirm`
- `https://v1.writeprompted.com/**`
- your `prompted-….vercel.app` address + `/auth/confirm`
- keep `http://localhost:3000/auth/confirm`

## 4. Test on the vercel.app address

Landing page → trial (one nudge) → create account → finish → reader note → part two →
"See how others answered" → Settings saves → sign out and back in with a magic link.

## 5. Swap the domains (about 5 minutes; the site may blip for a minute)

1. **Old v1 project** → Settings → Domains → **Add** `v1.writeprompted.com`.
2. **Old v1 project** → remove `www.writeprompted.com` and `writeprompted.com`.
3. **New prompted project** → Settings → Domains → add `www.writeprompted.com`, then
   `writeprompted.com` set to **redirect to www**.
4. **Leave every email DNS record alone** (MX and TXT records for support@). Moving a domain
   between Vercel projects doesn't touch them.

**Undo:** reverse step 5. The v1 project itself never changes.

## 6. After the swap

1. Supabase → URL Configuration → **Site URL** = `https://www.writeprompted.com`.
2. Vercel → prompted → Settings → **Cron Jobs**: confirm `/api/cron/reminder` is listed, then
   **Run** it once to test. (`CRON_SECRET` must be set; Vercel sends it automatically.)
3. Turn on the reminder in Prompted's Settings.
4. On your phone: open www.writeprompted.com in Safari → Share → **Add to Home Screen**.

## 7. Later

- **Send reminders from your domain:** Resend → Domains → add `writeprompted.com` and add the DNS
  records it shows in Vercel → Domains → writeprompted.com. Resend's records normally sit on a
  `send.` subdomain, so they don't collide with support@ email's records. Then set
  `EMAIL_FROM` = `Prompted <hello@writeprompted.com>` and redeploy.
- **Invite friends:** add their addresses to `EMAIL_ALLOWLIST` if they want reminders.
- **v1 banner:** a small "This is Prompted v1 (2024). See the new Prompted →" bar in the old repo.

## Good to know

- The reminder runs once a day at 00:00 UTC: about 7pm Central now, 6pm after Nov 1 (daylight
  saving ends). Vercel's free plan may run it up to 59 minutes late.
- v1 and v2 share one Supabase project. After the Site URL change, a sign-in email sent from v1
  may open v2 instead. No one uses v1, so this is acceptable.
- Read the experiments with the queries in `supabase/queries.sql`.

## Seeing how it's going (/admin)

Add `ADMIN_EMAILS` in Vercel (your sign-in email) and redeploy. Then open `/admin` while signed in. Anyone else gets a 404.
It shows daily writers against the goal of 100, who comes back, days per week, and how the features are doing.
