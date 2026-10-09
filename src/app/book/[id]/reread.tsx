"use client";

import { useEffect } from "react";
import { markReread } from "./actions";

/** Counts a reread when an older entry is actually opened (not on link prefetch). */
export function Reread({ entryId }: { entryId: string }) {
  useEffect(() => {
    void markReread(entryId);
  }, [entryId]);
  return null;
}
