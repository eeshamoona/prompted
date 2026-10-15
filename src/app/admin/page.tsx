import { notFound } from "next/navigation";
import { isAdmin, loadMetrics } from "@/lib/admin";
import { getUser } from "@/lib/data";
import { shortDate } from "@/lib/dates";
import { isAllowed } from "@/lib/email";
import { SendTest } from "@/app/admin/send-test";

export const metadata = { title: "Admin · Prompted", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function Stat({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
      <span className="font-serif text-4xl leading-none">{value}</span>
      <span className="text-sm font-medium">{label}</span>
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-2xl">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  const user = await getUser();
  if (!user || !isAdmin(user.email)) notFound();
  const m = await loadMetrics();

  const maxWriters = Math.max(1, ...m.activity.series.map((d) => d.writers));
  const maxHabit = Math.max(1, ...m.retention.habit.map((h) => h.people));
  const goalPct = Math.min(100, Math.round((m.goal.dauToday / m.goal.target) * 100));
  const setup = [
    { ok: !!process.env.RESEND_API_KEY, label: "RESEND_API_KEY is set" },
    { ok: !!process.env.EMAIL_FROM, label: "EMAIL_FROM is set" },
    { ok: isAllowed(user.email), label: "Your email is in EMAIL_ALLOWLIST" },
    { ok: !!process.env.CRON_SECRET, label: "CRON_SECRET is set" },
  ];
  const moodTotal = m.quality.mood.better + m.quality.mood.same + m.quality.mood.not_really;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-4xl">How it’s going</h1>
        <p className="text-sm text-muted-foreground">Only you can see this page. Numbers use Chicago time. Today is {shortDate(m.today)}.</p>
      </div>

      <Section title="The goal" hint="People who finished an answer today, out of 100 daily writers.">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-5xl leading-none">{m.goal.dauToday}</span>
            <span className="text-muted-foreground">of {m.goal.target} daily writers</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${goalPct}%` }} />
          </div>
        </div>
      </Section>

      <Section title="Is anyone showing up?" hint="Writers are people who finished at least one answer.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={m.activity.dauToday} label="Today" note={`${m.activity.dauYesterday} yesterday`} />
          <Stat value={m.activity.avgDau7} label="Average per day" note="last 7 days" />
          <Stat value={m.activity.wau} label="This week" note="people who wrote" />
          <Stat value={m.activity.mau} label="Last 30 days" note="people who wrote" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Writers per day, last 30 days</p>
          <div className="flex h-32 items-end gap-1" role="img" aria-label="Bar chart of writers per day for the last 30 days">
            {m.activity.series.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col justify-end" title={`${shortDate(d.date)}: ${d.writers}`}>
                <div className="w-full rounded-sm bg-primary" style={{ height: `${(d.writers / maxWriters) * 100}%`, minHeight: d.writers ? 3 : 1, opacity: d.writers ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{shortDate(m.activity.series[0].date)}</span>
            <span>{shortDate(m.today)}</span>
          </div>
        </div>
      </Section>

      <Section title="Do people come back?" hint="This is the real test. One visit means curiosity; a second day means it earned a place.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={`${m.retention.cameBackPct}%`} label="Wrote on another day" note={`${m.retention.cameBack} of ${m.retention.cameBackOf} first-time writers`} />
          <Stat value={`${m.retention.d1Pct}%`} label="Wrote the next day" note={`${m.retention.d1} of ${m.retention.d1Of}`} />
          <Stat value={m.retention.habitPeople} label="3+ days this week" note={`of ${m.retention.activeLast7} who wrote`} />
          <Stat value={`${m.reach.activationPct}%`} label="Signed up, then wrote" note={`${m.reach.wroteOnce} of ${m.reach.signups}`} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Days written in the last 7, per person</p>
          <div className="flex h-24 items-end gap-3">
            {m.retention.habit.map((h) => (
              <div key={h.days} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs text-muted-foreground">{h.people}</span>
                <div className="w-full rounded-sm bg-primary" style={{ height: `${(h.people / maxHabit) * 70}%`, minHeight: h.people ? 4 : 1, opacity: h.people ? 1 : 0.25 }} />
                <span className="text-xs">{h.days}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Reach" hint="How many people have found it.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={m.reach.signups} label="Accounts" />
          <Stat value={m.reach.signupsLast7} label="New this week" />
          <Stat value={m.reach.remindersOn} label="Reminders on" />
          <Stat value={m.quality.entries} label="Answers written" />
        </div>
      </Section>

      <Section title="Is the writing good for them?" hint="These are the features we’re testing.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={`${m.quality.avgOwnPct}%`} label="Written by the person" note="average" />
          <Stat value={`${m.quality.usedNudgePct}%`} label="Used a nudge" note="of answers" />
          <Stat value={`${m.quality.partTwoPct}%`} label="Wrote part two" note="answered the reader" />
          <Stat value={`${m.quality.sharedPct}%`} label="Shared" note="of answers" />
          <Stat value={m.quality.avgWords} label="Words per answer" />
          <Stat value={`${m.quality.medianMinutes} min`} label="Typical time" note="median" />
          <Stat value={m.quality.rereads} label="Answers reread" />
          <Stat value={m.choice.wantAnother} label="“Want another?” taps" note={`${m.choice.swapped} prompt swaps`} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">How people felt after</p>
          {moodTotal === 0 ? (
            <p className="text-muted-foreground">No one has answered yet.</p>
          ) : (
            <p>
              Better {m.quality.mood.better} · About the same {m.quality.mood.same} · Not really {m.quality.mood.not_really}
            </p>
          )}
        </div>
      </Section>

      <Section title="Reminder check" hint="Reminders go out about 8 am Chicago time, only to people who turned them on and are on the allowlist.">
        <ul className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 text-sm">
          {setup.map((s) => (
            <li key={s.label}>{s.ok ? "✓" : "✗"} {s.label}</li>
          ))}
          <li>{m.reach.remindersOn} {m.reach.remindersOn === 1 ? "person has" : "people have"} reminders turned on</li>
        </ul>
        <SendTest />
      </Section>

      <Section title="People" hint="Emails are partly hidden.">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Who</th>
                <th className="p-3 font-medium">Joined</th>
                <th className="p-3 font-medium">Answers</th>
                <th className="p-3 font-medium">Last wrote</th>
                <th className="p-3 font-medium">Days this week</th>
              </tr>
            </thead>
            <tbody>
              {m.people.map((p, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3">{p.who}</td>
                  <td className="p-3">{shortDate(p.joined)}</td>
                  <td className="p-3">{p.entries}</td>
                  <td className="p-3">{p.last ? shortDate(p.last) : "never"}</td>
                  <td className="p-3">{p.days7}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
