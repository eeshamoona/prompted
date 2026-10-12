"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";
import { PERSONAS } from "@/lib/ai";

function validTimezone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function saveSettings(formData: FormData) {
  const user = await requireUser();
  const persona = String(formData.get("persona") ?? "muse");
  const timezone = String(formData.get("timezone") ?? "").trim();
  const supabase = await createClient();
  await supabase
    .from("v2_profiles")
    .update({
      persona: persona in PERSONAS ? persona : "muse",
      reminder_enabled: formData.get("reminder") === "on",
      display_name: String(formData.get("display_name") ?? "").trim().slice(0, 40) || null,
      ...(validTimezone(timezone) ? { timezone } : {}),
    })
    .eq("user_id", user.id);
  redirect("/settings?saved=1");
}
