/** Pure text helpers (no server imports), shared by pages and tests. */

/** The reader's closing question, if the note ends with one. */
export function extractQuestion(note: string | null | undefined): string | null {
  if (!note) return null;
  const sentences = note.trim().match(/[^.!?]*[.!?]+["”’)]*\s*/g) ?? [note.trim()];
  for (let i = sentences.length - 1; i >= 0; i--) {
    const s = sentences[i].trim();
    if (s.endsWith("?") || /\?["”’)]+$/.test(s)) return s.replace(/^[—–\-;,\s]+/, "");
  }
  return null;
}

/** The note without its closing question (so the question can be shown on its own). */
export function withoutQuestion(note: string, question: string | null): string {
  if (!question) return note;
  const idx = note.lastIndexOf(question);
  return idx >= 0 ? (note.slice(0, idx) + note.slice(idx + question.length)).trim() : note;
}

const STOPWORDS = new Set(
  `a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each even every few for from further get gets got had has have having he her here hers herself him himself his how i if in into is it its itself just like me more most much my myself no nor not now of off on once only or other our ours ourselves out over own really same she should so some such than that the their theirs them themselves then there these they thing things this those through to too under until up us very was we were what when where which while who whom why will with would you your yours yourself yourselves i'm i've i'd i'll it's that's don't can't didn't isn't wasn't there's let's one would could maybe something someone everyone`.split(/\s+/)
);

/** Most-used words in the writer's OWN text: nudge ranges are removed first. */
export function wordFrequencies(entries: { text: string; ai_spans?: [number, number][] | null }[], limit = 30) {
  const counts = new Map<string, number>();
  for (const e of entries) {
    let own = e.text;
    for (const [a, b] of [...(e.ai_spans ?? [])].sort((x, y) => y[0] - x[0])) {
      own = own.slice(0, a) + " " + own.slice(b);
    }
    for (const raw of own.toLowerCase().match(/[a-z][a-z'’-]*/g) ?? []) {
      const w = raw.replace(/’/g, "'").replace(/^'+|'+$/g, "");
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export type Milestone = "first" | "week" | "month" | null;

/** A small moment on the Finished screen for the first answer and 7- and 30-day streaks. */
export function milestoneFor(totalEntries: number, streak: number, isTodaysEntry: boolean): Milestone {
  if (!isTodaysEntry) return null;
  if (totalEntries === 1) return "first";
  if (streak === 30) return "month";
  if (streak === 7) return "week";
  return null;
}
