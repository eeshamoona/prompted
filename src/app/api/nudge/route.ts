import { NextResponse, type NextRequest } from "next/server";
import { getProfile, getUser } from "@/lib/data";
import { getPrompt, getRotation, pickPrompt } from "@/lib/prompts";
import { DEFAULT_TZ, localDate } from "@/lib/dates";
import { nudge } from "@/lib/ai";

const TRIAL_NUDGES = 1;
const TRIAL_COOKIE = "prompted_trial_nudges";

export async function POST(request: NextRequest) {
  const user = await getUser();
  const body = (await request.json().catch(() => null)) as { promptId?: number; text?: string } | null;
  const prompt = body?.promptId ? await getPrompt(Number(body.promptId)) : null;
  if (!prompt) return NextResponse.json({ error: "Unknown prompt." }, { status: 400 });

  // Visitors without an account get one nudge, on today's featured prompt only.
  let trialUsed = 0;
  if (!user) {
    trialUsed = Number(request.cookies.get(TRIAL_COOKIE)?.value ?? 0) || 0;
    if (trialUsed >= TRIAL_NUDGES) return NextResponse.json({ error: "Trial nudge used." }, { status: 429 });
    const featured = pickPrompt(await getRotation(), localDate(DEFAULT_TZ));
    if (featured?.id !== prompt.id) return NextResponse.json({ error: "Sign in to use nudges." }, { status: 401 });
  } else {
    await getProfile(user.id);
  }

  const text = String(body?.text ?? "").slice(-4000);
  try {
    const fragment = await nudge(prompt.text, text);
    const res = NextResponse.json({ fragment });
    if (!user) res.cookies.set(TRIAL_COOKIE, String(trialUsed + 1), { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Nudge unavailable." }, { status: 502 });
  }
}
