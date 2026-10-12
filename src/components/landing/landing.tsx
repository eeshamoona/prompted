import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { SameQuestionAnswers } from "./answers";

const TRY_HREF = "/welcome?v=none";

function Step({ time, title, body, children, flip = false }: { time: string; title: string; body: string; children: React.ReactNode; flip?: boolean }) {
  return (
    <Reveal>
      <section className={`flex flex-col gap-8 py-10 md:items-center md:gap-14 ${flip ? "md:flex-row-reverse" : "md:flex-row"}`}>
        <div className="flex flex-col gap-3 md:flex-1">
          <span className="text-sm text-primary tabular-nums">{time}</span>
          <h3 className="font-serif text-3xl leading-tight sm:text-4xl">{title}</h3>
          <p className="text-lg leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <div className="md:flex-1">{children}</div>
      </section>
    </Reveal>
  );
}

/** Logged-out home: explains Prompted without needing an account. */
export function Landing({ prompt }: { prompt: { text: string; category: string; number: number } | null }) {
  return (
    // Break out of the narrow app column so the landing page can use the full width.
    <div className="-mt-6 mx-[calc(50%-50vw)] w-screen sm:-mt-8">
      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-5 pb-16 pt-14 sm:px-6 md:flex-row md:items-center md:gap-14 md:pt-20">
        <div className="flex flex-col gap-6 md:flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">A daily creative warm-up</p>
          <h1 className="font-serif text-5xl leading-[1.02] text-balance sm:text-6xl">A daily spark for your imagination.</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            One curated prompt a day, with no wrong answer. Write a few lines, take a nudge if you’re stuck, and get instant reader feedback on your entry with AI. Whatever you write stays yours.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild>
              <Link href={TRY_HREF}>Try today’s prompt</Link>
            </Button>
            <span className="text-sm text-muted-foreground">No account needed</span>
          </div>
        </div>
        {prompt && (
          <Link
            href={TRY_HREF}
            className="flex -rotate-1 flex-col gap-3 rounded-3xl border border-border bg-surface p-6 transition-transform hover:rotate-0 md:flex-1 sm:p-8"
          >
            <span className="text-xs uppercase tracking-[0.16em] text-primary">
              Today · No. {prompt.number} · {prompt.category}
            </span>
            <span className="font-serif text-3xl leading-tight">{prompt.text}</span>
            <span className="text-sm text-muted-foreground">Tap to answer it now →</span>
          </Link>
        )}
      </section>

      {/* Same question, different answers */}
      <section className="bg-muted">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-16 sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Same question · different answers</p>
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">If you could create a brand-new holiday, what would it celebrate?</h2>
            <p className="text-lg text-muted-foreground">Four people, four answers. None of them is right. That’s the point.</p>
          </div>
          <SameQuestionAnswers />
        </div>
      </section>

      {/* A day with Prompted */}
      <section className="mx-auto max-w-5xl px-5 pt-16 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">A morning with Prompted</h2>
          <ArrowDown className="size-6 text-primary" strokeWidth={1.6} aria-hidden="true" />
        </div>

        <Step time="7:58 am" title="A prompt arrives" body="One question each morning, curated so there’s no wrong answer. Sometimes whimsical, sometimes cozy, sometimes about you.">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
            <span className="text-xs uppercase tracking-[0.16em] text-primary">Pretend</span>
            <span className="font-serif text-2xl leading-snug">You’re the last slice of pizza at a party. How do you feel as everyone debates whether to take you?</span>
          </div>
        </Step>

        <Step flip time="8:01 am" title="You write. Stuck? Take a nudge." body="A nudge offers half a sentence in softer text, and you finish the thought. Keep it, change it, or delete it.">
          <div className="rounded-2xl border border-border bg-surface p-6 text-lg leading-[1.75]">
            Honestly? I’ve made peace with being left. The cheese has gone a little cold, but it has character now.{" "}
            <span className="text-nudge">Every time a hand hovers over the box I hold my breath, and</span> I practice my most charming crust.
          </div>
        </Step>

        <Step time="8:05 am" title="Instant reader feedback" body="Get instant reader feedback on your entry with AI. Your reader notices what made it yours and asks one question. Answer it, and it becomes part two.">
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-muted p-5">
              <span className="text-xs uppercase tracking-[0.14em] text-primary">Your Muse</span>
              <p className="mt-1 font-serif text-xl leading-snug">“The cheese has character now” made me laugh. Who do you secretly hope takes you?</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <span className="text-xs uppercase tracking-[0.14em] text-primary">Part two</span>
              <p className="mt-1 leading-relaxed">The quiet kid by the snacks who hasn’t eaten yet. They’d appreciate a slice with history.</p>
            </div>
          </div>
        </Step>

        <Step flip time="8:07 am" title="Done, and you can see how much was you" body="Every answer becomes a keepsake card with your streak and the share you wrote yourself.">
          <div className="flex -rotate-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-primary">No. 282 · Pretend</span>
              <span aria-hidden="true" className="flex size-11 rotate-12 items-center justify-center rounded-full border-2 border-primary text-[10px] font-semibold text-primary">DONE</span>
            </div>
            <span className="font-serif text-xl">The last slice of pizza at a party</span>
            <span className="flex items-baseline gap-2">
              <span className="font-serif text-4xl">86%</span>
              <span className="text-sm text-muted-foreground">written by you · 1 nudge</span>
            </span>
            <span className="grid grid-cols-7 gap-1.5" aria-hidden="true">
              {[1, 1, 1, 1, 1, 0, 0].map((w, i) => (
                <span key={i} className={`h-3.5 rounded ${w ? "bg-primary" : "bg-muted"}`} />
              ))}
            </span>
          </div>
        </Step>

        <Step time="A month later" title="Your answers add up" body="A private book of your takes, and the words you keep reaching for. Turns out you think about food and stories a lot.">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
            <span className="text-xs uppercase tracking-[0.16em] text-primary">Your words in October</span>
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-serif">
              <span className="text-4xl">stories</span>
              <span className="text-lg text-muted-foreground">window</span>
              <span className="text-3xl">food</span>
              <span className="text-base text-muted-foreground">quiet</span>
              <span className="text-2xl">build</span>
              <span className="text-base text-muted-foreground">morning</span>
              <span className="text-3xl">home</span>
              <span className="text-lg text-muted-foreground">secret</span>
              <span className="text-xl">friends</span>
            </span>
            <span className="text-sm text-muted-foreground">24 answers · 81% written by you</span>
          </div>
        </Step>
      </section>

      {/* Final call to action */}
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">Start with today’s.</h2>
            <p className="text-lg opacity-85">A few minutes. No account until you want to keep it.</p>
            <Link href={TRY_HREF} className="inline-flex h-12 items-center rounded-full bg-background px-6 font-medium text-foreground hover:opacity-90">
              Try today’s prompt
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
