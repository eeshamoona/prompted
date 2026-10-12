"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  promptId: number;
  kind: "swapped" | "want_another";
  label: string;
  className?: string;
};

/** Moves to another prompt right away and logs the tap in the background. */
export function AnotherPrompt({ href, promptId, kind, label, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go() {
    try {
      void fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, kind }),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Logging is best-effort; the prompt still changes.
    }
    startTransition(() => router.push(href));
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      aria-busy={pending}
      className={cn("min-h-11 text-muted-foreground hover:text-foreground disabled:opacity-60", className)}
    >
      {pending ? "Finding another…" : label}
    </button>
  );
}
