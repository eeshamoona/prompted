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

import { extractQuestion, milestoneFor, withoutQuestion, wordFrequencies } from "../src/lib/text";
import { promptNumber } from "../src/lib/dates";

test("prompt number matches the day (Oct 8, 2026 is No. 281)", () => {
  assert.equal(promptNumber("2026-01-01"), 1);
  assert.equal(promptNumber("2026-10-08"), 281);
});

test("the reader's closing question is found and separated from the note", () => {
  const note = "“Favorite childhood food” is a table of tiny time machines. I love it; what dish would you most want someone to make for you?";
  const q = extractQuestion(note);
  assert.equal(q, "I love it; what dish would you most want someone to make for you?");
  assert.equal(withoutQuestion(note, q), "“Favorite childhood food” is a table of tiny time machines.");
  assert.equal(extractQuestion("No question here. Just warmth!"), null);
  assert.equal(extractQuestion(null), null);
});

test("your words skip common words and anything that came from a nudge", () => {
  const text = "Pizza pizza and more pizza, plus garlic bread forever";
  const start = text.indexOf("garlic");
  const words = wordFrequencies([{ text, ai_spans: [[start, text.length]] }]);
  assert.deepEqual(words[0], { word: "pizza", count: 3 });
  assert.ok(!words.some((w) => w.word === "garlic" || w.word === "and"));
});

test("milestones: first answer, 7 and 30 days, only for today's entry", () => {
  assert.equal(milestoneFor(1, 1, true), "first");
  assert.equal(milestoneFor(9, 7, true), "week");
  assert.equal(milestoneFor(40, 30, true), "month");
  assert.equal(milestoneFor(9, 5, true), null);
  assert.equal(milestoneFor(1, 1, false), null);
});

import { parseSamples } from "../src/lib/samples";

test("sample answers parse from messy model output and get fixed voice labels", () => {
  const raw = 'Here you go:\n[{"title":"Leftover Day","text":"A holiday for food that is better the next morning, obviously."},{"title":"x","text":"too short"},{"title":"Window Seat Day","text":"Everyone who never had the window seat finally gets it today."}] Enjoy!';
  const s = parseSamples(raw);
  assert.equal(s.length, 2);
  assert.equal(s[0].author_label, "A daydreamer");
  assert.equal(s[1].author_label, "A storyteller");
  assert.deepEqual(parseSamples("not json"), []);
});
