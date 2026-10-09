import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { localDate } from "@/lib/dates";
import { pickPrompt, type Prompt } from "@/lib/prompts";
import { isAllowed, sendReminder } from "@/lib/email";

/**
 * Runs once each morning (vercel.json). Emails today's prompt to people who turned reminders on,
 * haven't written today, and haven't been reminded today. Only allowlisted addresses are emailed.
 */
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const [{ data: profiles }, { data: prompts }] = await Promise.all([
    db.from("v2_profiles").select("user_id, timezone, last_reminded_on").eq("reminder_enabled", true),
    db.from("v2_prompts").select("id, text, category, rotation").eq("active", true).order("rotation"),
  ]);

  const results = { considered: profiles?.length ?? 0, sent: 0, skipped: 0, failed: 0 };

  for (const profile of profiles ?? []) {
    const today = localDate(profile.timezone);
    if (profile.last_reminded_on === today) { results.skipped++; continue; }

    const { count } = await db
      .from("v2_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .eq("entry_date", today);
    if (count) { results.skipped++; continue; }

    const { data: userData } = await db.auth.admin.getUserById(profile.user_id);
    const email = userData.user?.email;
    if (!isAllowed(email)) { results.skipped++; continue; }

    const prompt = pickPrompt((prompts ?? []) as Prompt[], today);
    if (!prompt || !email) { results.skipped++; continue; }

    try {
      await sendReminder(email, prompt.text, appUrl);
      await db.from("v2_profiles").update({ last_reminded_on: today }).eq("user_id", profile.user_id);
      results.sent++;
    } catch {
      results.failed++;
    }
  }

  return NextResponse.json(results);
}
