import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/confetti";
import { getEntries, getEntry, getProfile, progress, requireUser } from "@/lib/data";
import { PERSONAS } from "@/lib/ai";
import type { Persona } from "@/lib/data";
import { promptNumber } from "@/lib/dates";
import { milestoneFor, withoutQuestion } from "@/lib/text";
import { cn } from "@/lib/utils";
import { answerReminder, setMood } from "./actions";

const MOOD_OPTIONS = [
  { value: "better", label: "Lighter" },
  { value: "same", label: "About the same" },
  { value: "not_really", label: "Not really" },
] as const;

const MILESTONE_TEXT = {
  first: "Your very first answer. Your book has begun.",
  week: "Seven days in a row. A whole week of your own answers.",
  month: "Thirty days in a row. That’s a real ritual.",
} as const;

export default async function DonePage({ params }: PageProps<"/done/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [entry, profile, entries] = await Promise.all([getEntry(id), getProfile(user.id), getEntries(200)]);
  if (!entry) notFound();
  const stats = progress(entries, profile.timezone);
  const persona = PERSONAS[(entry.persona as Persona) ?? "muse"] ?? PERSONAS.muse;
  const milestone = milestoneFor(entries.length, stats.streak, entry.entry_date === stats.today);
  const ownPct = Math.round(entry.own_percentage);
  const firstLine = entry.text.trim().split(/(?<=[.!?])\s/)[0].slice(0, 140);
  const question = entry.reply_question;
  const note = entry.reaction ? withoutQuestion(entry.reaction, question) : null;

  return (
    <div className="relative flex flex-1 flex-col gap-7">
      <Confetti />
      <h1 className="pt-6 font-serif text-5xl leading-none">That’s today.</h1>
      {milestone && <p className="text-lg text-primary">{MILESTONE_TEXT[milestone]}</p>}

      {/* The keepsake card */}
      <section aria-label="Today’s card" className="animate-card-in -rotate-1 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">
            No. {promptNumber(entry.entry_date)} · {entry.v2_prompts?.category}
          </p>
          <span aria-hidden="true" className="flex size-12 shrink-0 rotate-12 items-center justify-center rounded-full border-2 border-primary text-[11px] font-semibold tracking-wide text-primary">
            DONE
          </span>
        </div>
        <p className="mt-2 font-serif text-xl leading-snug sm:text-2xl">{entry.v2_prompts?.text}</p>
        <p className="mt-3 text-muted-foreground italic">“{firstLine}{firstLine.length < entry.text.trim().length ? "…" : ""}”</p>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-serif text-3xl text-foreground">{ownPct}%</span>
          <span className="text-sm text-muted-foreground">
            written by you{entry.nudge_count ? ` · ${entry.nudge_count} ${entry.nudge_count === 1 ? "nudge" : "nudges"}` : " · no nudges"} · {entry.word_count} words
          </span>
        </div>
        <ol aria-label="This week" className="mt-4 grid grid-cols-7 gap-1.5">
          {stats.week.map((d) => (
            <li key={d.date} className={cn("h-4 rounded", d.written ? "bg-primary" : "bg-muted")} />
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          {stats.streak} {stats.streak === 1 ? "day" : "days"} in a row · {stats.daysThisWeek} this week
        </p>
      </section>

      {entry.reaction && (
        <section className="flex flex-col gap-3" aria-label="A note from your reader">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">A note from your {persona.label}</p>
          {note && <p className="font-serif text-xl leading-snug sm:text-2xl">{note}</p>}
          {question && !entry.reply_text && (
            <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
              <p className="font-serif text-xl leading-snug text-primary">{question}</p>
              <Button asChild size="sm" className="self-start">
                <Link href={`/reply/${entry.id}`}>Answer the question</Link>
              </Button>
              <p className="text-xs text-muted-foreground">Optional. It becomes part two of today’s answer.</p>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="mood-q" className="flex flex-col gap-3">
        <p id="mood-q" className="text-sm text-muted-foreground">
          {entry.mood ? "Thanks for telling me." : "How do you feel after writing? (optional)"}
        </p>
        <form action={setMood} className="flex flex-wrap gap-2">
          <input type="hidden" name="entryId" value={entry.id} />
          {MOOD_OPTIONS.map((m) => (
            <Button key={m.value} type="submit" name="mood" value={m.value} size="sm" variant={entry.mood === m.value ? "default" : "outline"} aria-pressed={entry.mood === m.value}>
              {m.label}
            </Button>
          ))}
        </form>
      </section>

      {!profile.reminder_asked && !profile.reminder_enabled && (
        <section aria-labelledby="reminder-q" className="flex flex-col gap-3 rounded-xl bg-muted p-5">
          <p id="reminder-q">Want tomorrow’s prompt in your inbox each morning?</p>
          <form action={answerReminder} className="flex flex-wrap gap-2">
            <input type="hidden" name="entryId" value={entry.id} />
            <Button type="submit" name="answer" value="yes" size="sm">Yes, remind me</Button>
            <Button type="submit" name="answer" value="no" size="sm" variant="ghost">No thanks</Button>
          </form>
          <p className="text-xs text-muted-foreground">You can change this any time in Settings.</p>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={`/book/${entry.id}`} className="text-primary hover:underline">Read it in your book</Link>
        <span className="text-muted-foreground">A new prompt arrives tomorrow.</span>
      </div>
    </div>
  );
}
