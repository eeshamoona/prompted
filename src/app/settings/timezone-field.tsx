"use client";

import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Days are counted in your own timezone; offers the browser's timezone if it differs. */
export function TimezoneField({ current }: { current: string }) {
  const [value, setValue] = useState(current);
  const detected = useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null
  );

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="timezone" className="text-sm font-medium">Your timezone</label>
      <input
        id="timezone"
        name="timezone"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-12 rounded-lg border border-border bg-surface px-4"
      />
      {detected && value !== detected && (
        <button type="button" onClick={() => setValue(detected)} className="self-start text-sm text-primary hover:underline">
          Use {detected} (from this device)
        </button>
      )}
    </div>
  );
}
