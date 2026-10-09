import Link from "next/link";
import { WeekDots } from "@/components/week-dots";
import { getEntries, getProfile, progress, requireUser } from "@/lib/data";
import { shortDate } from "@/lib/dates";

export default async function BookPage() {
  const user = await requireUser();
  const [profile, entries] = await Promise.all([getProfile(user.id), getEntries()]);
  const stats = progress(entries, profile.timezone);

  return (
    <div className="flex flex-col gap-7">
      <h1 className="font-serif text-4xl">Your book</h1>
      <WeekDots week={stats.week} variant="tiles" />
      <p className="text-sm text-muted-foreground">
        {entries.length} {entries.length === 1 ? "answer" : "answers"}, all yours · {stats.daysThisWeek} of 7 days this week
      </p>
      {entries.length === 0 ? (
        <p className="text-muted-foreground">
          Nothing here yet. <Link href="/" className="text-primary hover:underline">Today’s prompt</Link> is waiting.
        </p>
      ) : (
        <ul className="flex flex-col border-b border-border">
          {entries.map((e) => (
            <li key={e.id} className="border-t border-border">
              <Link href={`/book/${e.id}`} className="flex flex-col gap-1.5 py-5 hover:opacity-80">
                <span className="text-xs text-muted-foreground">
                  {shortDate(e.entry_date)} · {e.v2_prompts?.category ?? ""}
                </span>
                <span className="font-serif text-xl leading-snug">{e.v2_prompts?.text ?? "Prompt"}</span>
                <span className="line-clamp-1 text-sm text-muted-foreground">{e.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
