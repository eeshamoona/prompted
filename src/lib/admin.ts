import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, localDate } from "@/lib/dates";
import { computeMetrics, type MEntry, type MEvent, type MProfile, type MUser } from "@/lib/metrics";

/** Only the emails in ADMIN_EMAILS can open /admin. Unset means nobody. */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function loadMetrics() {
  const db = createServiceClient();

  const [entries, events, profiles] = await Promise.all([
    db
      .from("v2_entries")
      .select("user_id, entry_date, word_count, nudge_count, own_percentage, elapsed_seconds, reply_text, shared, mood, reread_count")
      .limit(50000),
    db.from("v2_prompt_events").select("kind").limit(100000),
    db.from("v2_profiles").select("user_id, reminder_enabled").limit(50000),
  ]);

  const users: MUser[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const batch = data?.users ?? [];
    users.push(...batch.map((u) => ({ id: u.id, email: u.email ?? null, created_at: u.created_at })));
    if (batch.length < 1000) break;
  }

  return computeMetrics(
    {
      entries: (entries.data ?? []) as MEntry[],
      events: (events.data ?? []) as MEvent[],
      users,
      profiles: (profiles.data ?? []) as MProfile[],
    },
    localDate(DEFAULT_TZ),
  );
}
