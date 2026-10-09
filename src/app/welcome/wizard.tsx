"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Editor } from "@/app/write/editor";
import { sendMagicLink, signIn, signUp } from "@/app/login/actions";

export type WizardVariant = "short" | "full" | "none";
type Step = "welcome" | "cards" | "write" | "save";

const CARDS = [
  {
    title: "One prompt, every day",
    body: "A new question each morning: sometimes whimsical, sometimes cozy, sometimes about you. If it doesn’t spark anything, ask for another.",
  },
  {
    title: "Stuck? Take a nudge",
    body: "A nudge offers the start of a sentence, shown in softer text, for you to finish. Keep it, change it, or delete it.",
    example: true,
  },
  {
    title: "Your answers add up",
    body: "Get instant reader feedback on your entry with AI, then keep every answer in your own private book.",
  },
];

function markSeen() {
  document.cookie = "prompted_seen_welcome=1; max-age=31536000; path=/; samesite=lax";
}

export function Wizard({
  prompt,
  variant,
  signedIn,
}: {
  prompt: { id: number; text: string; category: string };
  variant: WizardVariant;
  signedIn: boolean;
}) {
  const [step, setStep] = useState<Step>(variant === "none" ? "write" : "welcome");
  const [card, setCard] = useState(0);

  function startWriting() {
    markSeen();
    setStep("write");
  }

  if (step === "welcome") {
    return (
      <div className="flex flex-1 flex-col justify-center gap-8">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Welcome to Prompted</p>
        <h1 className="font-serif text-5xl leading-tight">A daily spark for your imagination.</h1>
        <p className="text-lg text-muted-foreground">
          One prompt a day. No right answer, only yours. A few minutes, and you’ve made something no one else would have.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {variant === "full" ? (
            <Button onClick={() => setStep("cards")}>How it works</Button>
          ) : (
            <Button onClick={startWriting}>Try today’s prompt</Button>
          )}
          {!signedIn && (
            <Button asChild variant="ghost">
              <Link href="/login">I have an account</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === "cards") {
    const c = CARDS[card];
    const last = card === CARDS.length - 1;
    return (
      <div className="flex flex-1 flex-col justify-center gap-8">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {card + 1} of {CARDS.length}
        </p>
        <h1 className="font-serif text-4xl leading-tight">{c.title}</h1>
        <p className="text-lg text-muted-foreground">{c.body}</p>
        {c.example && (
          <p className="rounded-lg bg-surface p-5 text-lg leading-[1.75]">
            The cheese has gone a little cold, but it has character now,{" "}
            <span className="text-nudge">and secretly I’m hoping it’s the person who</span>
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="px-0 hover:bg-transparent" onClick={startWriting}>
            Skip
          </Button>
          <Button onClick={() => (last ? startWriting() : setCard(card + 1))}>{last ? "Try today’s prompt" : "Next"}</Button>
        </div>
      </div>
    );
  }

  if (step === "write") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Today · {prompt.category}</p>
        <h1 className="font-serif text-3xl leading-snug">{prompt.text}</h1>
        {variant === "none" && (
          <p className="text-sm text-muted-foreground">There’s no right answer. Write a few lines, and tap Nudge if you get stuck.</p>
        )}
        <div className="h-px bg-border" />
        {signedIn ? (
          <Editor promptId={prompt.id} />
        ) : (
          <Editor promptId={prompt.id} mode="trial" nudgeLimit={1} onTrialFinish={() => setStep("save")} />
        )}
      </div>
    );
  }

  // step === "save": the visitor has written something; an account keeps it.
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl leading-tight">Keep what you wrote.</h1>
        <p className="text-muted-foreground">
          Create a free account to save your answer, start your book, and read a note from your reader.
        </p>
      </div>
      <form className="flex flex-col gap-4">
        <input type="hidden" name="next" value="/welcome/save" />
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">
            Password <span className="font-normal text-muted-foreground">(not needed for a magic link)</span>
          </Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} />
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <Button formAction={signUp}>Create account and save</Button>
          <Button formAction={sendMagicLink} variant="outline">Email me a magic link</Button>
          <Button formAction={signIn} variant="ghost">I already have an account</Button>
        </div>
        <p className="text-xs text-muted-foreground">Your answer waits in this browser until you’re signed in.</p>
      </form>
    </div>
  );
}
