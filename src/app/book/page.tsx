import Link from "next/link";
import { WeekDots } from "@/components/week-dots";
import { YourWords } from "@/components/your-words";
import { getEntries, getProfile, progress, requireUser } from "@/lib/data";
import { promptNumber, shortDate } from "@/lib/dates";

export default async function BookPage() {
  const user = await requireUser();
  const [profile, entries] = await Promise.all([getProfile(user.id), getEntries()]);
  const stats = progress(entries, profile.timezone);
  const month = stats.today.slice(0, 7);
  const monthEntries = entries.filter((e) => e.entry_date.startsWith(month));
  const monthLabel = new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const avgOwn = entries.length ? Math.round(entries.reduce((s, e) => s + Number(e.own_percentage), 0) / entries.length) : 100;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="font-serif text-4xl">Your book</h1>
      <WeekDots week={stats.week} variant="tiles" />
      <p className="text-sm text-muted-foreground">
        {entries.length} {entries.length === 1 ? "answer" : "answers"} · {stats.daysThisWeek} of 7 days this week
        {entries.length > 0 && <> · <span className="text-foreground">{avgOwn}% written by you</span></>}
      </p>
      <YourWords entries={monthEntries} monthLabel={monthLabel} />
      {entries.length === 0 ? (
        <p className="text-muted-foreground">
          Nothing here yet. <Link href="/" className="text-primary hover:underline">Today’s prompt</Link> is waiting.
        </p>
      ) : (
        <ul className="flex flex-col border-b border-border">
          {entries.map((e) => (
            <li key={e.id} className="border-t border-border">
              <Link href={`/book/${e.id}`} className="flex flex-col gap-1.5 py-5 hover:opacity-80">
                <span className="flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
                  <span>No. {promptNumber(e.entry_date)} · {shortDate(e.entry_date)} · {e.v2_prompts?.category ?? ""}</span>
                  <span>
                    {Math.round(Number(e.own_percentage))}% yours{e.reply_text ? " · part two" : ""}
                  </span>
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
