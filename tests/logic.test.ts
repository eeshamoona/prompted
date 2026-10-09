import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, localDate, streak, weekDates } from "../src/lib/dates";
import { CATEGORIES, pickPrompt, type Prompt } from "../src/lib/rotation";
import { applyEdit, insertNudge, spansOf, textOf, type Char } from "../src/lib/track";

const typed = (s: string): Char[] => applyEdit([], s);

test("streak counts consecutive days and survives until tonight", () => {
  const today = "2026-10-09";
  assert.equal(streak(new Set([today, "2026-10-08", "2026-10-07"]), today), 3);
  // Not written yet today: yesterday's streak still counts.
  assert.equal(streak(new Set(["2026-10-08", "2026-10-07"]), today), 2);
  // A gap breaks it.
  assert.equal(streak(new Set([today, "2026-10-07"]), today), 1);
  assert.equal(streak(new Set(), today), 0);
});

test("week runs Monday to Sunday", () => {
  const week = weekDates("2026-10-09"); // a Friday
  assert.equal(week[0], "2026-10-05");
  assert.equal(week[6], "2026-10-11");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("local date follows the person's timezone", () => {
  const lateNightChicago = new Date("2026-10-09T04:30:00Z"); // 11:30pm Oct 8 in Chicago
  assert.equal(localDate("America/Chicago", lateNightChicago), "2026-10-08");
  assert.equal(localDate("Europe/London", lateNightChicago), "2026-10-09");
});

const rotation: Prompt[] = Array.from({ length: 134 }, (_, i) => ({
  id: i + 1,
  text: `Prompt ${i + 1}`,
  category: CATEGORIES[i % CATEGORIES.length],
  rotation: i,
}));

test("featured prompt is stable for a date and changes the next day", () => {
  const a = pickPrompt(rotation, "2026-10-09");
  assert.deepEqual(pickPrompt(rotation, "2026-10-09"), a);
  assert.notEqual(pickPrompt(rotation, "2026-10-10")?.id, a?.id);
});

test("'Another prompt' always switches category and doesn't repeat for a while", () => {
  const featured = pickPrompt(rotation, "2026-10-09")!;
  const seen = new Set<number>();
  for (let alt = 1; alt <= 20; alt++) {
    const p = pickPrompt(rotation, "2026-10-09", alt)!;
    assert.notEqual(p.category, featured.category);
    seen.add(p.id);
  }
  assert.equal(seen.size, 20);
});

test("empty rotation returns nothing instead of crashing", () => {
  assert.equal(pickPrompt([], "2026-10-09"), null);
});

test("nudge text is tracked, and edits to it become the writer's own", () => {
  let chars = typed("The pizza waited");
  chars = insertNudge(chars, chars.length, " and hoped someone");
  assert.equal(textOf(chars), "The pizza waited and hoped someone");
  assert.deepEqual(spansOf(chars), [[16, 34]]);
  // Writer finishes the sentence: new words are theirs, the nudge stays marked.
  chars = applyEdit(chars, textOf(chars) + " kind would choose it.");
  assert.deepEqual(spansOf(chars), [[16, 34]]);
  // Writer rewords part of the nudge: only the untouched parts stay marked.
  chars = applyEdit(chars, textOf(chars).replace("hoped", "wished"));
  const spans = spansOf(chars);
  assert.equal(spans.length, 2);
  assert.ok(spans.every(([a, b]) => !textOf(chars).slice(a, b).includes("wished")));
});

test("deleting a nudge removes its marking entirely", () => {
  let chars = insertNudge(typed("Hello"), 5, " there friend");
  chars = applyEdit(chars, "Hello");
  assert.deepEqual(spansOf(chars), []);
  assert.equal(textOf(chars), "Hello");
});
