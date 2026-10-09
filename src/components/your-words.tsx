import { wordFrequencies } from "@/lib/text";

type E = { text: string; ai_spans: [number, number][] | null; reply_text?: string | null; reply_ai_spans?: [number, number][] | null };

/** "Your words": the words you reach for most this month, sized by how often. Nudge text never counts. */
export function YourWords({ entries, monthLabel }: { entries: E[]; monthLabel: string }) {
  const sources = entries.flatMap((e) => [
    { text: e.text, ai_spans: e.ai_spans },
    ...(e.reply_text ? [{ text: e.reply_text, ai_spans: e.reply_ai_spans ?? [] }] : []),
  ]);
  const words = wordFrequencies(sources, 28);
  if (words.length < 3) return null;
  const max = words[0].count;
  const min = words[words.length - 1].count;
  const scale = (n: number) => (max === min ? 1 : (n - min) / (max - min));
  // Gentle shuffle so the biggest words don't all cluster at the start.
  const arranged = words.map((w, i) => ({ ...w, order: (i * 7) % words.length }));

  return (
    <section aria-labelledby="your-words" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <h2 id="your-words" className="text-xs uppercase tracking-[0.16em] text-primary">Your words in {monthLabel}</h2>
      <ul className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {arranged.map((w) => {
          const t = scale(w.count);
          return (
            <li
              key={w.word}
              style={{ order: w.order, fontSize: `${0.9 + t * 1.5}rem`, opacity: 0.55 + t * 0.45 }}
              className={t > 0.6 ? "font-serif text-foreground" : "font-serif text-muted-foreground"}
              title={`${w.word}: ${w.count}`}
            >
              {w.word}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">Only your own words count, never nudge text.</p>
    </section>
  );
}
