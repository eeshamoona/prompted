import { dayIndex } from "./dates";

export const CATEGORIES = ["Imagine", "Invent", "Adventure", "Pretend", "Cozy", "Grateful", "Reflect"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Prompt = { id: number; text: string; category: Category; rotation: number };

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
