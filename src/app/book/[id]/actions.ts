"use server";

import { createClient } from "@/lib/supabase/server";
import { getEntry, getProfile, requireUser } from "@/lib/data";
import { localDate } from "@/lib/dates";

/** One reread per entry per day, and only for entries written on an earlier day. */
export async function markReread(entryId: string) {
  const user = await requireUser();
  const [entry, profile] = await Promise.all([getEntry(entryId), getProfile(user.id)]);
  if (!entry) return;
  const today = localDate(profile.timezone);
  if (entry.entry_date >= today || entry.last_reread_on === today) return;
  const supabase = await createClient();
  await supabase
    .from("v2_entries")
    .update({ reread_count: (entry.reread_count ?? 0) + 1, last_reread_on: today })
    .eq("id", entryId);
}
