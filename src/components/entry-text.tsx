/** Renders an answer with nudge-sourced ranges in the softer nudge color. */
export function EntryText({ text, spans }: { text: string; spans: [number, number][] }) {
  const parts: { text: string; ai: boolean }[] = [];
  let cursor = 0;
  for (const [a, b] of [...spans].sort((x, y) => x[0] - y[0])) {
    if (a > cursor) parts.push({ text: text.slice(cursor, a), ai: false });
    parts.push({ text: text.slice(Math.max(a, cursor), b), ai: true });
    cursor = Math.max(cursor, b);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), ai: false });
  return (
    <p className="whitespace-pre-wrap break-words text-lg leading-[1.75]">
      {parts.map((p, i) => (
        <span key={i} className={p.ai ? "text-nudge" : undefined}>{p.text}</span>
      ))}
    </p>
  );
}
