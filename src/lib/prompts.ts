import "server-only";
import { createClient } from "@/lib/supabase/server";
import { dayIndex } from "@/lib/dates";

export const CATEGORIES = ["Imagine", "Invent", "Adventure", "Pretend", "Cozy", "Grateful", "Reflect"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_HINTS: Record<Category, string> = {
  Imagine: "a whimsical what-if",
  Invent: "design something playful",
  Adventure: "step into a story",
  Pretend: "be someone or something else",
  Cozy: "a calm, sensory scene",
  Grateful: "a small good thing",
  Reflect: "about you",
};

export type Prompt = { id: number; text: string; category: Category; rotation: number };

export async function getRotation(): Promise<Prompt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v2_prompts")
    .select("id, text, category, rotation")
    .eq("active", true)
    .order("rotation");
  if (error) throw new Error(error.message);
  return (data ?? []) as Prompt[];
}

export async function getPrompt(id: number): Promise<Prompt | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("v2_prompts").select("id, text, category, rotation").eq("id", id).maybeSingle();
  return (data as Prompt) ?? null;
}

/**
 * Today's featured prompt is the same for everyone on a given local date.
 * `alt` > 0 returns the alt-th alternative, always from a different category than the featured one.
 */
export function pickPrompt(rotation: Prompt[], date: string, alt = 0): Prompt | null {
  if (rotation.length === 0) return null;
  const n = rotation.length;
  const start = ((dayIndex(date) % n) + n) % n;
  const featured = rotation[start];
  if (alt <= 0) return featured;
  const others: Prompt[] = [];
  for (let step = 1; step < n; step++) {
    const p = rotation[(start + step * 7) % n];
    if (p.category !== featured.category && !others.includes(p)) others.push(p);
  }
  return others.length ? others[(alt - 1) % others.length] : featured;
}
