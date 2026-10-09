import { NextResponse } from "next/server";
import { getUser } from "@/lib/data";
import { getPrompt } from "@/lib/prompts";
import { nudge } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use nudges." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { promptId?: number; text?: string } | null;
  const prompt = body?.promptId ? await getPrompt(Number(body.promptId)) : null;
  if (!prompt) return NextResponse.json({ error: "Unknown prompt." }, { status: 400 });

  const text = String(body?.text ?? "").slice(-4000);
  try {
    const fragment = await nudge(prompt.text, text);
    return NextResponse.json({ fragment });
  } catch {
    return NextResponse.json({ error: "Nudge unavailable." }, { status: 502 });
  }
}
