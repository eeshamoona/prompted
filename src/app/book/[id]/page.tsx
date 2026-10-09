import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryText } from "@/components/entry-text";
import { getEntry, requireUser } from "@/lib/data";
import { shortDate } from "@/lib/dates";

export default async function EntryPage({ params }: PageProps<"/book/[id]">) {
  const { id } = await params;
  await requireUser();
  const entry = await getEntry(id);
  if (!entry) notFound();
  const minutes = Math.max(1, Math.round(entry.elapsed_seconds / 60));

  return (
    <article className="flex flex-col gap-6">
      <Link href="/book" className="text-sm text-muted-foreground hover:text-foreground">← Your book</Link>
      <p className="text-xs uppercase tracking-[0.16em] text-primary">
        {shortDate(entry.entry_date)} · {entry.v2_prompts?.category}
      </p>
      <h1 className="font-serif text-3xl leading-snug">{entry.v2_prompts?.text}</h1>
      <div className="h-px bg-border" />
      <EntryText text={entry.text} spans={entry.ai_spans ?? []} />
      {entry.reaction && (
        <section className="border-t border-border pt-5" aria-label="Reader’s note">
          <p className="font-serif text-xl leading-snug text-muted-foreground">{entry.reaction}</p>
        </section>
      )}
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">If you’re curious</summary>
        <p className="mt-2">
          {entry.word_count} words · about {minutes} min · {Math.round(entry.own_percentage)}% your own words
          {entry.nudge_count ? ` · ${entry.nudge_count} ${entry.nudge_count === 1 ? "nudge" : "nudges"}` : ""}
        </p>
      </details>
    </article>
  );
}
