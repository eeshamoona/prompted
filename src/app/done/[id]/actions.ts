"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";

const MOODS = ["better", "same", "not_really"] as const;

export async function setMood(formData: FormData) {
  await requireUser();
  const entryId = String(formData.get("entryId"));
  const mood = String(formData.get("mood"));
  if (!MOODS.includes(mood as (typeof MOODS)[number])) return;
  const supabase = await createClient();
  await supabase.from("v2_entries").update({ mood }).eq("id", entryId); // RLS: only your own entry
  revalidatePath(`/done/${entryId}`);
}

export async function answerReminder(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId"));
  const yes = formData.get("answer") === "yes";
  const supabase = await createClient();
  await supabase.from("v2_profiles").update({ reminder_asked: true, reminder_enabled: yes }).eq("user_id", user.id);
  revalidatePath(`/done/${entryId}`);
}
