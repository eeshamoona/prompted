import "server-only";
export { CATEGORIES, pickPrompt, type Category, type Prompt } from "@/lib/rotation";
import { createClient } from "@/lib/supabase/server";
import type { Category, Prompt } from "@/lib/rotation";

export const CATEGORY_HINTS: Record<Category, string> = {
  Imagine: "a whimsical what-if",
  Invent: "design something playful",
  Adventure: "step into a story",
  Pretend: "be someone or something else",
  Cozy: "a calm, sensory scene",
  Grateful: "a small good thing",
  Reflect: "about you",
};

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

