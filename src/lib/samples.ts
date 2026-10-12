/** Pure helpers for AI-written sample answers (always shown labeled "Sample"). */

export const SAMPLE_VOICES = [
  { label: "A daydreamer", style: "lyrical and imaginative, drifting into wonder" },
  { label: "A wisecracker", style: "funny and playful, with one unexpected joke" },
  { label: "A storyteller", style: "a small concrete scene with a character and a moment" },
] as const;

export type Sample = { author_label: string; title: string; text: string };

/** Parses the model's JSON array, tolerating stray text around it. Returns at most one sample per voice. */
export function parseSamples(raw: string): Sample[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  let items: unknown;
  try {
    items = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(items)) return [];
  const out: Sample[] = [];
  items.slice(0, SAMPLE_VOICES.length).forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const { title, text } = item as { title?: unknown; text?: unknown };
    if (typeof text !== "string" || text.trim().length < 20) return;
    out.push({
      author_label: SAMPLE_VOICES[i].label,
      title: typeof title === "string" ? title.trim().slice(0, 60) : "",
      text: text.trim().slice(0, 1200),
    });
  });
  return out;
}
