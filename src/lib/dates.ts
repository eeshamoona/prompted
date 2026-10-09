/** All "days" in Prompted are the person's local calendar days. */

export const DEFAULT_TZ = "America/Chicago";

export function localDate(timeZone: string = DEFAULT_TZ, at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

function toUtcMs(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  return new Date(toUtcMs(date) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Days since a fixed epoch; drives which prompt is featured. */
export function dayIndex(date: string): number {
  return Math.floor((toUtcMs(date) - toUtcMs("2026-01-01")) / 86_400_000);
}

/** Consecutive days written, ending today (or yesterday, so the streak survives until tonight). */
export function streak(dates: Set<string>, today: string): number {
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Monday-to-Sunday dates for the week containing `today`. */
export function weekDates(today: string): string[] {
  const weekday = (new Date(toUtcMs(today)).getUTCDay() + 6) % 7; // Monday = 0
  const monday = addDays(today, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function weekdayLong(date: string): string {
  return new Date(toUtcMs(date)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

export function shortDate(date: string): string {
  return new Date(toUtcMs(date)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
