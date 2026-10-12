import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekDots } from "@/components/week-dots";
import { Landing } from "@/components/landing/landing";
import { AnotherPrompt } from "@/components/another-prompt";
import { getEntries, getProfile, getUser, progress } from "@/lib/data";
import { DEFAULT_TZ, localDate, promptNumber, weekdayLong } from "@/lib/dates";
import { CATEGORY_HINTS, getRotation, pickPrompt } from "@/lib/prompts";

export default async function TodayPage({ searchParams }: PageProps<"/">) {
  const { alt: altParam, skip } = await searchParams;
  const alt = Math.max(0, Number(altParam) || 0);

  const user = await getUser();
  const profile = user ? await getProfile(user.id) : null;
  const timezone = profile?.timezone ?? DEFAULT_TZ;
  const today = localDate(timezone);

  const [rotation, entries] = await Promise.all([getRotation(), user ? getEntries(60) : Promise.resolve([])]);
  // Visitors without an account see the landing page; new accounts that haven't written yet start with the wizard.
  if (!user) {
    const featured = pickPrompt(rotation, today);
    return <Landing prompt={featured ? { text: featured.text, category: featured.category, number: promptNumber(today) } : null} />;
  }
  const seenWelcome = (await cookies()).get("prompted_seen_welcome")?.value === "1";
  if (!skip && entries.length === 0 && !seenWelcome) redirect("/welcome");

  const prompt = pickPrompt(rotation, today, alt);
  const stats = user ? progress(entries, timezone) : null;

  if (!prompt) {
    return <p className="text-muted-foreground">No prompts yet. Run the seed SQL in Supabase to load them.</p>;
  }

  const writeHref = `/write?p=${prompt.id}`;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>No. {promptNumber(today)} · {weekdayLong(today)}</span>
        {stats && <span>{stats.streak} {stats.streak === 1 ? "day" : "days"}</span>}
      </div>
      {stats && <WeekDots week={stats.week} />}

      <section className="flex flex-1 flex-col justify-center gap-6 py-6" aria-labelledby="prompt">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          {alt > 0 ? "Another prompt" : "Today"} · {prompt.category}
          <span className="normal-case tracking-normal text-muted-foreground"> — {CATEGORY_HINTS[prompt.category]}</span>
        </p>
        <h1 id="prompt" className="font-serif text-[2.4rem] leading-tight text-balance sm:text-5xl">
          {prompt.text}
        </h1>
        <p className="text-sm text-muted-foreground">A few minutes. No wrong answer.</p>
        {stats?.writtenToday && (
          <p className="text-sm text-muted-foreground">
            You’ve already written today. <Link href="/book" className="text-primary hover:underline">See it in your book</Link>, or write another.
          </p>
        )}
      </section>

      <div className="flex items-center justify-between">
        <AnotherPrompt href={`/?alt=${alt + 1}`} promptId={prompt.id} kind="swapped" label="Another prompt" className="text-base" />
        <Button asChild size="icon" aria-label="Start writing">
          <Link href={user ? writeHref : `/login?next=${encodeURIComponent(writeHref)}`}>
            <ArrowRight className="size-6" strokeWidth={1.8} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
