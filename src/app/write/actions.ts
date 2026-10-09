"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, requireUser } from "@/lib/data";
import { getPrompt } from "@/lib/prompts";
import { localDate } from "@/lib/dates";
import { reaction } from "@/lib/ai";
import { extractQuestion } from "@/lib/text";

type Input = { promptId: number; text: string; aiSpans: [number, number][]; nudgeCount: number; elapsedSeconds: number };

export async function saveEntry(input: Input): Promise<{ error: string } | void> {
  const user = await requireUser();
  const text = input.text.trim();
  if (!text) return { error: "Write a little something first." };
  if (text.length > 20000) return { error: "That’s longer than an entry can be." };

  const [profile, prompt] = await Promise.all([getProfile(user.id), getPrompt(input.promptId)]);
  if (!prompt) return { error: "That prompt no longer exists." };

  const spans = (input.aiSpans ?? [])
    .filter((s) => Array.isArray(s) && s.length === 2 && s[0] >= 0 && s[1] > s[0] && s[1] <= input.text.length)
    .slice(0, 200);
  const aiChars = spans.reduce((sum, [a, b]) => sum + (b - a), 0);
  const ownPercentage = input.text.length ? Math.max(0, 100 - (aiChars / input.text.length) * 100) : 100;

  let readerNote: string | null = null;
  try {
    readerNote = await reaction(prompt.text, text, profile.persona);
  } catch {
    readerNote = null; // The entry still saves if the AI is unavailable.
  }

  const supabase = await createClient();
  const entryDate = localDate(profile.timezone);
  const { data, error } = await supabase
    .from("v2_entries")
    .insert({
      user_id: user.id,
      prompt_id: prompt.id,
      entry_date: entryDate,
      text: input.text,
      ai_spans: spans,
      word_count: text.split(/\s+/).filter(Boolean).length,
      nudge_count: Math.max(0, Math.min(input.nudgeCount, 1000)),
      own_percentage: Number(ownPercentage.toFixed(2)),
      elapsed_seconds: Math.max(0, Math.min(input.elapsedSeconds, 86400)),
      persona: profile.persona,
      reaction: readerNote,
      reply_question: extractQuestion(readerNote),
    })
    .select("id")
    .single();
  if (error) return { error: "Couldn’t save your answer. Please try again." };

  await supabase.from("v2_prompt_events").insert({ user_id: user.id, prompt_id: prompt.id, event_date: entryDate, kind: "finished" });
  redirect(`/done/${data.id}`);
}
