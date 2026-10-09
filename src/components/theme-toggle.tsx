"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemeChoice = "system" | "light" | "dark";
const NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemeChoice, string> = { system: "Theme: matches your device", light: "Theme: light", dark: "Theme: dark" };

/** Cycles system → light → dark. Remembered in a cookie so the server renders the right colors. */
export function ThemeToggle({ initial }: { initial: ThemeChoice }) {
  const [choice, setChoice] = useState<ThemeChoice>(initial);

  function cycle() {
    const next = NEXT[choice];
    setChoice(next);
    document.cookie = `prompted_theme=${next}; max-age=31536000; path=/; samesite=lax`;
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }

  const Icon = choice === "light" ? Sun : choice === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABEL[choice]}. Switch theme`}
      title={LABEL[choice]}
      className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-5" strokeWidth={1.8} />
    </button>
  );
}
