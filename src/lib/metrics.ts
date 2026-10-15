import { addDays } from "./dates";

export type MEntry = {
  user_id: string;
  entry_date: string;
  word_count: number;
  nudge_count: number;
  own_percentage: number;
  elapsed_seconds: number;
  reply_text: string | null;
  shared: boolean;
  mood: "better" | "same" | "not_really" | null;
  reread_count: number;
};
export type MEvent = { kind: string };
export type MUser = { id: string; email: string | null; created_at: string };
export type MProfile = { user_id: string; reminder_enabled: boolean };

export const DAILY_GOAL = 100;

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function maskEmail(email: string | null): string {
  if (!email) return "unknown";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}***@${domain ?? ""}`;
}

export function computeMetrics(
  input: { entries: MEntry[]; events: MEvent[]; users: MUser[]; profiles: MProfile[] },
  today: string,
) {
  const { entries, events, users, profiles } = input;

  const datesByUser = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!datesByUser.has(e.user_id)) datesByUser.set(e.user_id, new Set());
    datesByUser.get(e.user_id)!.add(e.entry_date);
  }

  const writersOn = (date: string) => [...datesByUser.values()].filter((s) => s.has(date)).length;
  const writersBetween = (from: string, to: string) =>
    [...datesByUser.values()].filter((s) => [...s].some((d) => d >= from && d <= to)).length;

  // Daily writers for the last 30 days (oldest first).
  const series = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i - 29);
    return { date, writers: writersOn(date), entries: entries.filter((e) => e.entry_date === date).length };
  });

  const weekStart = addDays(today, -6);
  const avgDau7 = Math.round((series.slice(-7).reduce((s, d) => s + d.writers, 0) / 7) * 10) / 10;

  // Habit: how many of the last 7 days each active writer wrote.
  const daysLast7 = new Map<string, number>();
  for (const [uid, set] of datesByUser) {
    const n = [...set].filter((d) => d >= weekStart && d <= today).length;
    if (n) daysLast7.set(uid, n);
  }
  const habit = Array.from({ length: 7 }, (_, i) => ({
    days: i + 1,
    people: [...daysLast7.values()].filter((n) => n === i + 1).length,
  }));
  const habitPeople = [...daysLast7.values()].filter((n) => n >= 3).length;

  // Activation and return, per person's first entry.
  const firstDate = new Map<string, string>();
  for (const [uid, set] of datesByUser) firstDate.set(uid, [...set].sort()[0]);
  const wroteOnce = firstDate.size;
  const eligibleReturn = [...firstDate.entries()].filter(([, d]) => d < today);
  const cameBack = eligibleReturn.filter(([uid, d]) => [...datesByUser.get(uid)!].some((x) => x > d)).length;
  const eligibleD1 = [...firstDate.entries()].filter(([, d]) => addDays(d, 1) <= today);
  const d1 = eligibleD1.filter(([uid, d]) => datesByUser.get(uid)!.has(addDays(d, 1))).length;

  const n = entries.length;
  const rows = users
    .map((u) => {
      const set = datesByUser.get(u.id) ?? new Set<string>();
      return {
        who: maskEmail(u.email),
        joined: u.created_at.slice(0, 10),
        entries: entries.filter((e) => e.user_id === u.id).length,
        last: [...set].sort().slice(-1)[0] ?? null,
        days7: daysLast7.get(u.id) ?? 0,
      };
    })
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));

  const count = (k: string) => events.filter((e) => e.kind === k).length;

  return {
    today,
    goal: { target: DAILY_GOAL, dauToday: writersOn(today) },
    reach: {
      signups: users.length,
      signupsLast7: users.filter((u) => u.created_at.slice(0, 10) >= weekStart).length,
      wroteOnce,
      activationPct: pct(wroteOnce, users.length),
      remindersOn: profiles.filter((p) => p.reminder_enabled).length,
    },
    activity: {
      dauToday: writersOn(today),
      dauYesterday: writersOn(addDays(today, -1)),
      avgDau7,
      wau: writersBetween(weekStart, today),
      mau: writersBetween(addDays(today, -29), today),
      series,
    },
    retention: {
      cameBack,
      cameBackOf: eligibleReturn.length,
      cameBackPct: pct(cameBack, eligibleReturn.length),
      d1,
      d1Of: eligibleD1.length,
      d1Pct: pct(d1, eligibleD1.length),
      habit,
      habitPeople,
      activeLast7: daysLast7.size,
    },
    quality: {
      entries: n,
      avgOwnPct: n ? Math.round(entries.reduce((s, e) => s + Number(e.own_percentage), 0) / n) : 0,
      usedNudgePct: pct(entries.filter((e) => e.nudge_count > 0).length, n),
      partTwoPct: pct(entries.filter((e) => e.reply_text).length, n),
      sharedPct: pct(entries.filter((e) => e.shared).length, n),
      rereads: entries.filter((e) => e.reread_count > 0).length,
      avgWords: n ? Math.round(entries.reduce((s, e) => s + e.word_count, 0) / n) : 0,
      medianMinutes: Math.round((median(entries.map((e) => e.elapsed_seconds)) / 60) * 10) / 10,
      mood: {
        better: entries.filter((e) => e.mood === "better").length,
        same: entries.filter((e) => e.mood === "same").length,
        not_really: entries.filter((e) => e.mood === "not_really").length,
      },
    },
    choice: {
      swapped: count("swapped"),
      wantAnother: count("want_another"),
      finished: count("finished"),
    },
    people: rows,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;
