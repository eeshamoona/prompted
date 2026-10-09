"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Sample = { name: string; title: string; before: string; nudge: string; after: string };

const SAMPLES: Sample[] = [
  { name: "Maya", title: "Leftover Day", before: "A holiday for the food that’s better the next morning. Everyone trades containers like secret recipes, and cold pizza is officially breakfast.", nudge: "", after: "" },
  { name: "Jordan", title: "The Day of Small Repairs", before: "One day a year to fix the thing you’ve been ignoring: the wobbly chair, the squeaky door, ", nudge: "the friendship you meant to call back, ", after: "and the zipper on your favorite jacket." },
  { name: "Priya", title: "Window Seat Day", before: "Every train, bus, and plane gives the window seat to whoever has never had it. ", nudge: "You get to watch the world rush by ", after: "and nobody is allowed to close the shade." },
  { name: "Sam", title: "Unfinished Things Day", before: "A celebration of half-knit scarves and abandoned novels. ", nudge: "Instead of guilt, there’s a parade where ", after: "everyone carries the project they never finished, proudly." },
];

function ownShare(s: Sample) {
  const total = s.before.length + s.nudge.length + s.after.length;
  return Math.round(((total - s.nudge.length) / total) * 100);
}

/** One prompt, several sample takes: the point is that every answer is different. */
export function SameQuestionAnswers() {
  const [picked, setPicked] = useState(0);
  const s = SAMPLES[picked];

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Sample answers" className="flex flex-wrap justify-center gap-2">
        {SAMPLES.map((p, i) => (
          <button
            key={p.name}
            type="button"
            role="tab"
            id={`answer-tab-${i}`}
            aria-selected={i === picked}
            aria-controls="answer-panel"
            onClick={() => setPicked(i)}
            className={cn(
              "h-11 rounded-full border px-5 text-base transition-colors",
              i === picked ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div
        id="answer-panel"
        role="tabpanel"
        aria-labelledby={`answer-tab-${picked}`}
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-primary">{s.name}’s take</span>
          <span className="text-sm text-muted-foreground">
            <span className="font-serif text-2xl text-foreground">{ownShare(s)}%</span> written by {s.name}
          </span>
        </div>
        <p className="font-serif text-3xl leading-tight">{s.title}</p>
        <p className="text-lg leading-[1.7]">
          {s.before}
          <span className="text-nudge">{s.nudge}</span>
          {s.after}
        </p>
        <p className="text-sm text-muted-foreground">
          Sample answers, written to show the range. <span className="text-nudge">Softer text</span> came from a nudge.
        </p>
      </div>
    </div>
  );
}
