import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/data";
import { getPrompt } from "@/lib/prompts";
import { Editor } from "./editor";

export default async function WritePage({ searchParams }: PageProps<"/write">) {
  const { p } = await searchParams;
  const user = await requireUser();
  const prompt = await getPrompt(Number(p));
  if (!prompt) notFound();
  await getProfile(user.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Today</Link>
      <h1 className="font-serif text-2xl leading-snug text-muted-foreground">{prompt.text}</h1>
      <div className="h-px bg-border" />
      <Editor promptId={prompt.id} />
    </div>
  );
}
