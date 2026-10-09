"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntry, requireUser, type Persona } from "@/lib/data";
import { closingNote } from "@/lib/ai";

type Draft = { text: string; aiSpans: [number, number][] };

/** Saves part two, then the reader closes the exchange with one line (no new question). */
export async function saveReply(entryId: string, draft: Draft): Promise<{ error: string } | void> {
  await requireUser();
  const entry = await getEntry(entryId);
  if (!entry || !entry.reply_question) return { error: "That answer isn’t available." };
  if (entry.reply_text) redirect(`/book/${entryId}`);
  const text = draft.text.trim();
  if (!text) return { error: "Write a little something first." };
  if (draft.text.length > 20000) return { error: "That’s longer than a reply can be." };

  const spans = (draft.aiSpans ?? [])
    .filter((s) => Array.isArray(s) && s.length === 2 && s[0] >= 0 && s[1] > s[0] && s[1] <= draft.text.length)
    .slice(0, 200);

  let closing: string | null = null;
  try {
    closing = await closingNote(entry.reply_question, text, (entry.persona as Persona) ?? "muse");
  } catch {
    closing = null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("v2_entries")
    .update({ reply_text: draft.text, reply_ai_spans: spans, reply_reaction: closing, replied_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) return { error: "Couldn’t save your reply. Please try again." };
  redirect(`/book/${entryId}`);
}
