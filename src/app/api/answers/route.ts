import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/data";
import { getPrompt } from "@/lib/prompts";
import { sampleAnswers } from "@/lib/ai";
import { parseSamples } from "@/lib/samples";

/**
 * Other people's answers to a prompt you have already answered: friends' shared answers first,
 * then AI-written samples (created once per prompt, always labeled "Sample").
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const promptId = Number(request.nextUrl.searchParams.get("promptId"));
  if (!promptId) return NextResponse.json({ error: "Missing prompt." }, { status: 400 });

  const supabase = await createClient();
  const { count } = await supabase
    .from("v2_entries")
    .select("id", { count: "exact", head: true })
    .eq("prompt_id", promptId);
  if (!count) return NextResponse.json({ answers: [] }); // write your own first

  await ensureSamples(promptId).catch(() => undefined); // samples are a nice-to-have

  const { data, error } = await supabase.rpc("v2_answers_for_prompt", { p_prompt_id: promptId });
  if (error) return NextResponse.json({ error: "Couldn’t load answers." }, { status: 500 });
  return NextResponse.json({ answers: data ?? [] });
}

async function ensureSamples(promptId: number) {
  const db = createServiceClient();
  const { count } = await db.from("v2_sample_answers").select("id", { count: "exact", head: true }).eq("prompt_id", promptId);
  if (count) return;
  const prompt = await getPrompt(promptId);
  if (!prompt) return;
  const samples = parseSamples(await sampleAnswers(prompt.text));
  if (samples.length === 0) return;
  await db
    .from("v2_sample_answers")
    .upsert(samples.map((s) => ({ prompt_id: promptId, ...s })), { onConflict: "prompt_id,author_label", ignoreDuplicates: true });
}
