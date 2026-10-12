"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";

export async function setShared(formData: FormData) {
  await requireUser();
  const entryId = String(formData.get("entryId"));
  const shared = formData.get("shared") === "true";
  const supabase = await createClient();
  await supabase.from("v2_entries").update({ shared }).eq("id", entryId); // RLS: only your own entry
  revalidatePath(`/done/${entryId}`);
  revalidatePath(`/book/${entryId}`);
}
