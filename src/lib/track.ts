export type Char = { c: string; ai: boolean };

export const textOf = (chars: Char[]) => chars.map((ch) => ch.c).join("");

/** Apply an edit made in the textarea: whatever changed in the middle counts as the writer's own text. */
export function applyEdit(chars: Char[], next: string): Char[] {
  const text = textOf(chars);
  let prefix = 0;
  while (prefix < text.length && prefix < next.length && text[prefix] === next[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < text.length - prefix &&
    suffix < next.length - prefix &&
    text[text.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) suffix++;
  const inserted = next.slice(prefix, next.length - suffix).split("").map((c) => ({ c, ai: false }));
  return [...chars.slice(0, prefix), ...inserted, ...chars.slice(text.length - suffix)];
}

/** Insert a nudge fragment at the caret, marked as AI text. */
export function insertNudge(chars: Char[], caret: number, fragment: string): Char[] {
  const added = fragment.split("").map((c) => ({ c, ai: true }));
  return [...chars.slice(0, caret), ...added, ...chars.slice(caret)];
}

export function spansOf(chars: Char[]): [number, number][] {
  const spans: [number, number][] = [];
  let start = -1;
  chars.forEach((ch, i) => {
    if (ch.ai && start < 0) start = i;
    if (!ch.ai && start >= 0) {
      spans.push([start, i]);
      start = -1;
    }
  });
  if (start >= 0) spans.push([start, chars.length]);
  return spans;
}

export function runsOf(chars: Char[]) {
  const runs: { text: string; ai: boolean }[] = [];
  for (const ch of chars) {
    const last = runs[runs.length - 1];
    if (last && last.ai === ch.ai) last.text += ch.c;
    else runs.push({ text: ch.c, ai: ch.ai });
  }
  return runs;
}
