import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEntry, requireUser } from "@/lib/data";
import { PERSONAS } from "@/lib/ai";
import type { Persona } from "@/lib/data";
import { Editor } from "@/app/write/editor";
import { saveReply } from "./actions";

/** Part two: answering the reader's question. */
export default async function ReplyPage({ params }: PageProps<"/reply/[id]">) {
  const { id } = await params;
  await requireUser();
  const entry = await getEntry(id);
  if (!entry) notFound();
  if (entry.reply_text || !entry.reply_question) redirect(`/book/${entry.id}`);
  const persona = PERSONAS[(entry.persona as Persona) ?? "muse"] ?? PERSONAS.muse;
  const save = saveReply.bind(null, entry.id);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Link href={`/done/${entry.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
      <p className="text-xs uppercase tracking-[0.16em] text-primary">Your {persona.label} asked</p>
      <h1 className="font-serif text-3xl leading-snug">{entry.reply_question}</h1>
      <div className="h-px bg-border" />
      <Editor promptId={entry.prompt_id} action={save} nudgeQuestion={entry.reply_question} submitLabel="Add to my answer" />
    </div>
  );
}
