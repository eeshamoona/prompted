"use client";

import { useEffect, useState } from "react";
import { EntryText } from "@/components/entry-text";

type Answer = {
  answer_kind: "shared" | "sample";
  author: string;
  answer_title: string | null;
  answer_text: string;
  answer_spans: [number, number][] | null;
  answer_own_pct: number | null;
};

/** Same question, different answers. Only loads for someone who has already answered the prompt. */
export function OthersAnswers({ promptId }: { promptId: number }) {
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || answers) return;
    let cancelled = false;
    fetch(`/api/answers?promptId=${promptId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { answers: Answer[] }) => !cancelled && setAnswers(d.answers))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, answers, promptId]);

  const shared = answers?.filter((a) => a.answer_kind === "shared") ?? [];
  const samples = answers?.filter((a) => a.answer_kind === "sample") ?? [];

  return (
    <section aria-labelledby="others-q" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="others-q" className="text-xs uppercase tracking-[0.16em] text-primary">Same question, different answers</h2>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="text-sm text-primary hover:underline">
            See how others answered
          </button>
        )}
      </div>
      {open && !answers && !failed && <p role="status" className="text-sm text-muted-foreground">Finding other takes…</p>}
      {failed && <p className="text-sm text-muted-foreground">Other answers aren’t available right now.</p>}
      {answers && answers.length === 0 && (
        <p className="text-sm text-muted-foreground">No one else has shared an answer to this one yet.</p>
      )}
      {answers && answers.length > 0 && (
        <ul className="flex flex-col gap-3">
          {[...shared, ...samples].map((a, i) => (
            <li key={i} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                <span className="uppercase tracking-[0.14em] text-primary">
                  {a.answer_kind === "sample" ? `Sample · ${a.author}` : a.author}
                </span>
                {a.answer_kind === "shared" && a.answer_own_pct !== null ? (
                  <span className="text-muted-foreground">{Math.round(Number(a.answer_own_pct))}% written by them</span>
                ) : (
                  <span className="text-muted-foreground">Written by AI to show the range</span>
                )}
              </div>
              {a.answer_title && <p className="font-serif text-xl leading-snug">{a.answer_title}</p>}
              <div className="text-base">
                <EntryText text={a.answer_text} spans={a.answer_spans ?? []} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {answers && shared.length === 0 && samples.length > 0 && (
        <p className="text-xs text-muted-foreground">Samples are labeled. When friends share their answers, theirs show first.</p>
      )}
    </section>
  );
}
