"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/data";
import { localDate } from "@/lib/dates";

/** "Another prompt": records the swap (for the choice test) and shows the next alternative. */
export async function swapPrompt(formData: FormData) {
  const alt = Number(formData.get("alt") ?? 0) + 1;
  const promptId = Number(formData.get("promptId"));
  const user = await getUser();
  if (user && promptId) {
    const profile = await getProfile(user.id);
    const supabase = await createClient();
    await supabase.from("v2_prompt_events").insert({
      user_id: user.id,
      prompt_id: promptId,
      event_date: localDate(profile.timezone),
      kind: "swapped",
    });
  }
  redirect(`/?alt=${alt}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
