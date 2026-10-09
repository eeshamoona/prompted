"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveEntry } from "./actions";

type Char = { c: string; ai: boolean };

function spansOf(chars: Char[]): [number, number][] {
  const spans: [number, number][] = [];
  let start = -1;
  chars.forEach((ch, i) => {
    if (ch.ai && start < 0) start = i;
    if (!ch.ai && start >= 0) {
      spans.push([start, i]);
      start = -1;
    }
  });
  if (start >= 0) spans.push([start, chars.length]);
  return spans;
}

function runsOf(chars: Char[]) {
  const runs: { text: string; ai: boolean }[] = [];
  for (const ch of chars) {
    const last = runs[runs.length - 1];
    if (last && last.ai === ch.ai) last.text += ch.c;
    else runs.push({ text: ch.c, ai: ch.ai });
  }
  return runs;
}

export function Editor({ promptId }: { promptId: number }) {
  const [chars, setChars] = useState<Char[]>([]);
  const [nudges, setNudges] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nudging, setNudging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  const text = chars.map((ch) => ch.c).join("");

  // Typing, pasting and deleting are all "yours": diff old vs new text and mark the changed middle as user text.
  function onChange(next: string) {
    if (startedAt === null) setStartedAt(Date.now());
    let prefix = 0;
    while (prefix < text.length && prefix < next.length && text[prefix] === next[prefix]) prefix++;
    let suffix = 0;
    while (
      suffix < text.length - prefix &&
      suffix < next.length - prefix &&
      text[text.length - 1 - suffix] === next[next.length - 1 - suffix]
    ) suffix++;
    const inserted = next.slice(prefix, next.length - suffix).split("").map((c) => ({ c, ai: false }));
    setChars([...chars.slice(0, prefix), ...inserted, ...chars.slice(text.length - suffix)]);
  }

  async function onNudge() {
    setError(null);
    setNudging(true);
    if (startedAt === null) setStartedAt(Date.now());
    const caret = ref.current?.selectionEnd ?? text.length;
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, text: text.slice(0, caret) }),
      });
      if (!res.ok) throw new Error();
      const { fragment } = (await res.json()) as { fragment: string };
      const added = fragment.split("").map((c) => ({ c, ai: true }));
      setChars((prev) => [...prev.slice(0, caret), ...added, ...prev.slice(caret)]);
      setNudges((n) => n + 1);
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret + added.length, caret + added.length);
      });
    } catch {
      setError("The nudge didn’t come through. Try again in a moment.");
    } finally {
      setNudging(false);
    }
  }

  function onFinish() {
    setError(null);
    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    startSaving(async () => {
      const result = await saveEntry({ promptId, text, aiSpans: spansOf(chars), nudgeCount: nudges, elapsedSeconds: elapsed });
      if (result?.error) setError(result.error);
    });
  }

  const shared = "w-full whitespace-pre-wrap break-words p-1 text-lg leading-[1.75] font-sans";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="relative flex-1">
        {/* Mirror layer shows nudge text in a softer color; the textarea on top handles typing. */}
        <div aria-hidden="true" className={`${shared} min-h-64 text-foreground`}>
          {runsOf(chars).map((run, i) => (
            <span key={i} className={run.ai ? "text-nudge" : undefined}>{run.text}</span>
          ))}
          {"​"}
        </div>
        <label htmlFor="answer" className="sr-only">Your answer</label>
        <textarea
          id="answer"
          ref={ref}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="There’s no right answer. Start anywhere."
          className={`${shared} absolute inset-0 h-full resize-none overflow-hidden bg-transparent text-transparent caret-foreground outline-none placeholder:text-muted-foreground`}
          autoFocus
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {nudges > 0 ? "Softer text came from a nudge. Keep it, change it, or let it go." : "Stuck? A nudge offers the start of a sentence for you to finish."}
      </p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onNudge} disabled={nudging || saving}>
          {nudging ? "Thinking…" : "Nudge"}
        </Button>
        <Button type="button" onClick={onFinish} disabled={saving || text.trim().length === 0}>
          {saving ? "Saving…" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
