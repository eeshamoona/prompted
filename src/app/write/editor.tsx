"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveEntry } from "./actions";
import { saveDraft } from "@/lib/draft";
import { applyEdit, insertNudge, runsOf, spansOf, textOf, type Char } from "@/lib/track";

type Draft = { promptId: number; text: string; aiSpans: [number, number][]; nudgeCount: number; elapsedSeconds: number };

type Props = {
  promptId: number;
  /** Saves the answer. Defaults to saving a new entry; part two passes its own action. */
  action?: (draft: Draft) => Promise<{ error: string } | void>;
  /** For part two: nudges continue the answer to the reader's question instead of the prompt. */
  nudgeQuestion?: string;
  submitLabel?: string;
  /** "trial": no account yet. Finish keeps the answer in this browser and hands off to sign-up. */
  mode?: "signed-in" | "trial";
  nudgeLimit?: number;
  onTrialFinish?: () => void;
};

export function Editor({ promptId, action = saveEntry, nudgeQuestion, submitLabel, mode = "signed-in", nudgeLimit, onTrialFinish }: Props) {
  const [chars, setChars] = useState<Char[]>([]);
  const [nudges, setNudges] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nudging, setNudging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  const text = textOf(chars);
  const nudgesLeft = nudgeLimit === undefined ? Infinity : Math.max(0, nudgeLimit - nudges);

  // Typing, pasting and deleting are all "yours": diff old vs new text and mark the changed middle as user text.
  function onChange(next: string) {
    if (startedAt === null) setStartedAt(Date.now());
    setChars(applyEdit(chars, next));
  }

  async function onNudge() {
    if (nudgesLeft <= 0) return;
    setError(null);
    setNudging(true);
    if (startedAt === null) setStartedAt(Date.now());
    const caret = ref.current?.selectionEnd ?? text.length;
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, question: nudgeQuestion, text: text.slice(0, caret) }),
      });
      if (res.status === 429) {
        setNudges(nudgeLimit ?? nudges);
        throw new Error("limit");
      }
      if (!res.ok) throw new Error();
      const { fragment } = (await res.json()) as { fragment: string };
      setChars((prev) => insertNudge(prev, caret, fragment));
      setNudges((n) => n + 1);
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret + fragment.length, caret + fragment.length);
      });
    } catch (e) {
      setError(
        e instanceof Error && e.message === "limit"
          ? "That was your trial nudge. Create an account for more."
          : "The nudge didn’t come through. Try again in a moment."
      );
    } finally {
      setNudging(false);
    }
  }

  function onFinish() {
    setError(null);
    const draft = {
      promptId,
      text,
      aiSpans: spansOf(chars),
      nudgeCount: nudges,
      elapsedSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
    };
    if (mode === "trial") {
      saveDraft({ ...draft, savedAt: Date.now() });
      onTrialFinish?.();
      return;
    }
    startSaving(async () => {
      const result = await action(draft);
      if (result?.error) setError(result.error);
    });
  }

  const shared = "w-full whitespace-pre-wrap break-words p-1 text-lg leading-[1.75] font-sans";
  const hint =
    nudges > 0
      ? "Softer text came from a nudge. Keep it, change it, or let it go."
      : "Stuck? A nudge offers the start of a sentence for you to finish.";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="relative -mx-2 flex-1 rounded-lg px-2 ring-1 ring-transparent transition-shadow focus-within:ring-border">
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
          className={`${shared} absolute inset-y-0 inset-x-2 h-full resize-none overflow-hidden bg-transparent text-transparent caret-foreground outline-none focus-visible:outline-none placeholder:text-muted-foreground`}
          autoFocus
        />
      </div>
      <p className="text-sm text-muted-foreground">{hint}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onNudge} disabled={nudging || saving || nudgesLeft <= 0}>
          {nudging ? "Thinking…" : nudgeLimit !== undefined ? `Nudge (${nudgesLeft} left)` : "Nudge"}
        </Button>
        <Button type="button" onClick={onFinish} disabled={saving || text.trim().length === 0}>
          {saving ? "Saving…" : mode === "trial" ? "Save my answer" : submitLabel ?? "Finish"}
        </Button>
      </div>
    </div>
  );
}
