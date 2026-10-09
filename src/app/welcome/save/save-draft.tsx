"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveEntry } from "@/app/write/actions";
import { clearDraft, loadDraft } from "@/lib/draft";

export function SaveDraft() {
  const started = useRef(false);
  const [message, setMessage] = useState("Saving your answer…");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (started.current) return; // guard against double effects in development
    started.current = true;
    const draft = loadDraft();
    if (!draft) {
      // Defer state updates out of the effect body.
      queueMicrotask(() => {
        setMessage("We couldn’t find your answer in this browser. It may have been written on another device.");
        setDone(true);
      });
      return;
    }
    clearDraft();
    const { savedAt: _savedAt, ...input } = draft;
    void _savedAt;
    saveEntry(input).then((result) => {
      if (result?.error) {
        setMessage(result.error);
        setDone(true);
      }
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <p role="status" className="font-serif text-3xl leading-snug">{message}</p>
      {done && (
        <Link href="/?skip=1" className="text-primary hover:underline">
          Go to today’s prompt
        </Link>
      )}
    </div>
  );
}
