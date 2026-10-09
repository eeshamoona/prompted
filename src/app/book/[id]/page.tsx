import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryText } from "@/components/entry-text";
import { getEntry, requireUser } from "@/lib/data";
import { PERSONAS } from "@/lib/ai";
import type { Persona } from "@/lib/data";
import { promptNumber, shortDate } from "@/lib/dates";
import { withoutQuestion } from "@/lib/text";
import { Reread } from "./reread";

function ownShare(text: string, spans: [number, number][]) {
  if (!text.length) return 100;
  const ai = spans.reduce((s, [a, b]) => s + (b - a), 0);
  return Math.round(Math.max(0, 100 - (ai / text.length) * 100));
}

export default async function EntryPage({ params }: PageProps<"/book/[id]">) {
  const { id } = await params;
  await requireUser();
  const entry = await getEntry(id);
  if (!entry) notFound();
  const persona = PERSONAS[(entry.persona as Persona) ?? "muse"] ?? PERSONAS.muse;
  const minutes = Math.max(1, Math.round(entry.elapsed_seconds / 60));
  const question = entry.reply_question;
  const note = entry.reaction ? withoutQuestion(entry.reaction, question) : null;

  // "% yours" across the whole answer, including part two.
  const totalChars = entry.text.length + (entry.reply_text?.length ?? 0);
  const aiChars = [...(entry.ai_spans ?? []), ...(entry.reply_ai_spans ?? [])].reduce((s, [a, b]) => s + (b - a), 0);
  const ownPct = totalChars ? Math.round(Math.max(0, 100 - (aiChars / totalChars) * 100)) : 100;

  return (
    <article className="flex flex-col gap-6">
      <Reread entryId={entry.id} />
      <Link href="/book" className="text-sm text-muted-foreground hover:text-foreground">← Your book</Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">
          No. {promptNumber(entry.entry_date)} · {shortDate(entry.entry_date)} · {entry.v2_prompts?.category}
        </p>
        <p className="text-sm">
          <span className="font-serif text-2xl">{ownPct}%</span> <span className="text-muted-foreground">written by you</span>
        </p>
      </div>
      <h1 className="font-serif text-3xl leading-snug">{entry.v2_prompts?.text}</h1>
      <div className="h-px bg-border" />
      <EntryText text={entry.text} spans={entry.ai_spans ?? []} />

      {note && (
        <section className="flex flex-col gap-2 border-t border-border pt-5" aria-label={`Note from your ${persona.label}`}>
          <p className="text-xs uppercase tracking-[0.16em] text-primary">Your {persona.label}</p>
          <p className="font-serif text-xl leading-snug text-muted-foreground">{note}</p>
        </section>
      )}

      {question && entry.reply_text ? (
        <section className="flex flex-col gap-4" aria-label="Part two">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-[0.16em] text-primary">Part two</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="font-serif text-xl italic leading-snug text-muted-foreground">{question}</p>
          <EntryText text={entry.reply_text} spans={entry.reply_ai_spans ?? []} />
          {entry.reply_reaction && (
            <p className="rounded-xl bg-muted p-4 font-serif text-lg leading-snug">
              <span className="mb-1 block font-sans text-xs uppercase tracking-[0.14em] text-primary">Your {persona.label}</span>
              {entry.reply_reaction}
            </p>
          )}
        </section>
      ) : question ? (
        <div className="flex flex-col gap-2 rounded-xl bg-muted p-4">
          <p className="font-serif text-xl leading-snug text-primary">{question}</p>
          <Link href={`/reply/${entry.id}`} className="text-sm text-primary hover:underline">Answer it as part two</Link>
        </div>
      ) : null}

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer py-1">If you’re curious</summary>
        <p className="mt-2">
          {entry.word_count} words · about {minutes} min · part one {ownShare(entry.text, entry.ai_spans ?? [])}% yours
          {entry.nudge_count ? ` · ${entry.nudge_count} ${entry.nudge_count === 1 ? "nudge" : "nudges"}` : ""}
          {entry.reread_count ? ` · reread ${entry.reread_count}×` : ""}
        </p>
      </details>
    </article>
  );
}
