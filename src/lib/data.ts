import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, localDate, streak, weekDates } from "@/lib/dates";

export type Persona = "muse" | "cheerleader" | "coach" | "critic" | "editor" | "guru";

export type Profile = {
  user_id: string;
  persona: Persona;
  timezone: string;
  reminder_enabled: boolean;
  reminder_hour: number;
  reminder_asked: boolean;
};

export type Entry = {
  id: string;
  prompt_id: number;
  entry_date: string;
  text: string;
  ai_spans: [number, number][];
  word_count: number;
  nudge_count: number;
  own_percentage: number;
  elapsed_seconds: number;
  persona: string | null;
  reaction: string | null;
  mood: "better" | "same" | "not_really" | null;
  reread_count: number;
  last_reread_on: string | null;
  reply_question: string | null;
  reply_text: string | null;
  reply_ai_spans: [number, number][];
  reply_reaction: string | null;
  replied_at: string | null;
  created_at: string;
  v2_prompts?: { text: string; category: string } | null;
};

/** The signed-in user, verified with Supabase Auth, or null. */
export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Reads the profile, creating one with defaults (reminders off) on first visit. */
export async function getProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data } = await supabase.from("v2_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as Profile;
  const { data: created, error } = await supabase
    .from("v2_profiles")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return created as Profile;
}

export async function getEntries(limit = 200): Promise<Entry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v2_entries")
    .select("*, v2_prompts(text, category)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Entry[];
}

export async function getEntry(id: string): Promise<Entry | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("v2_entries").select("*, v2_prompts(text, category)").eq("id", id).maybeSingle();
  return (data as Entry) ?? null;
}

/** Streak, days written this week (the main objective), and the week's dots. */
export function progress(entries: Pick<Entry, "entry_date">[], timezone = DEFAULT_TZ) {
  const today = localDate(timezone);
  const dates = new Set(entries.map((e) => e.entry_date));
  const week = weekDates(today).map((date) => ({ date, written: dates.has(date), isToday: date === today, future: date > today }));
  return {
    today,
    streak: streak(dates, today),
    daysThisWeek: week.filter((d) => d.written).length,
    writtenToday: dates.has(today),
    week,
  };
}
