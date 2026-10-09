/** A trial answer waits in this browser until the visitor creates an account. */
export type Draft = {
  promptId: number;
  text: string;
  aiSpans: [number, number][];
  nudgeCount: number;
  elapsedSeconds: number;
  savedAt: number;
};

const KEY = "prompted:draft";

export function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked (private mode): the trial still works, the answer just can't carry over.
  }
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    // Drafts older than two days are dropped.
    return Date.now() - d.savedAt < 2 * 86_400_000 && d.text?.trim() ? d : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
