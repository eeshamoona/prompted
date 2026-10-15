"use server";

import { getUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { isAllowed, sendReminder } from "@/lib/email";
import { getRotation, pickPrompt } from "@/lib/prompts";
import { localDate } from "@/lib/dates";

/** Sends today's reminder to the signed-in admin only, and says plainly what happened. */
export async function sendTestReminder(): Promise<string> {
  const user = await getUser();
  if (!user || !isAdmin(user.email) || !user.email) return "Not allowed.";
  if (!process.env.RESEND_API_KEY) return "RESEND_API_KEY isn't set on this server.";
  if (!isAllowed(user.email)) return "Your email isn't in EMAIL_ALLOWLIST on this server, so nothing was sent.";

  const prompt = pickPrompt(await getRotation(), localDate());
  if (!prompt) return "Couldn't find today's prompt.";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.writeprompted.com";
  const from = process.env.EMAIL_FROM || "Prompted <onboarding@resend.dev> (EMAIL_FROM isn't set)";
  const supabase = await createClient();
  const { count } = await supabase.from("v2_entries").select("id", { count: "exact", head: true });
  try {
    await sendReminder(user.email, prompt.text, appUrl, count ?? 0);
    return `Sent to ${user.email} from ${from}. Check your inbox and spam folder.`;
  } catch (e) {
    return `Resend said: ${e instanceof Error ? e.message : "something went wrong"}`;
  }
}
