import Link from "next/link";
import { notFound } from "next/navigation";
import { WeekDots } from "@/components/week-dots";
import { getEntries, getEntry, getProfile, progress, requireUser } from "@/lib/data";
import { PERSONAS } from "@/lib/ai";
import type { Persona } from "@/lib/data";

export default async function DonePage({ params }: PageProps<"/done/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [entry, profile, entries] = await Promise.all([getEntry(id), getProfile(user.id), getEntries(60)]);
  if (!entry) notFound();
  const stats = progress(entries, profile.timezone);
  const persona = PERSONAS[(entry.persona as Persona) ?? "muse"] ?? PERSONAS.muse;

  return (
    <div className="flex flex-1 flex-col gap-7">
      <div className="flex flex-1 flex-col justify-center gap-7">
        <h1 className="font-serif text-5xl leading-none">That’s today.</h1>
        <WeekDots week={stats.week} />
        <p className="text-sm text-muted-foreground">
          {stats.streak} {stats.streak === 1 ? "day" : "days"} in a row · {stats.daysThisWeek} this week
        </p>
        {entry.reaction && (
          <section className="flex flex-col gap-3 border-t border-border pt-6" aria-label="A reader’s note">
            <p className="text-xs uppercase tracking-[0.16em] text-primary">A note from your {persona.label}</p>
            <p className="font-serif text-2xl leading-snug">{entry.reaction}</p>
          </section>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <Link href={`/book/${entry.id}`} className="text-primary hover:underline">Read it in your book</Link>
        <span className="text-muted-foreground">A new prompt arrives tomorrow.</span>
      </div>
    </div>
  );
}
