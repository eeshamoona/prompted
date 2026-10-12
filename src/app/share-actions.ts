"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntry, getProfile, requireUser } from "@/lib/data";
import { localDate } from "@/lib/dates";

export async function setShared(formData: FormData) {
  await requireUser();
  const entryId = String(formData.get("entryId"));
  const shared = formData.get("shared") === "true";
  const supabase = await createClient();
  await supabase.from("v2_entries").update({ shared }).eq("id", entryId); // RLS: only your own entry
  revalidatePath(`/done/${entryId}`);
  revalidatePath(`/book/${entryId}`);
}

/** The "Want another?" test: count the tap, then show a different prompt. */
export async function wantAnother(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId"));
  const [entry, profile] = await Promise.all([getEntry(entryId), getProfile(user.id)]);
  if (entry) {
    const supabase = await createClient();
    await supabase.from("v2_prompt_events").insert({
      user_id: user.id,
      prompt_id: entry.prompt_id,
      event_date: localDate(profile.timezone),
      kind: "want_another",
    });
  }
  redirect("/?alt=1&skip=1");
}
