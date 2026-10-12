import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/data";
import { localDate } from "@/lib/dates";

const KINDS = new Set(["swapped", "want_another"]);

/** Logs "Another prompt" and "Want another?" taps for the choice tests. Never blocks navigation. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return new NextResponse(null, { status: 204 });
  const body = (await request.json().catch(() => null)) as { promptId?: number; kind?: string } | null;
  const promptId = Number(body?.promptId);
  if (!promptId || !body?.kind || !KINDS.has(body.kind)) return NextResponse.json({ error: "Bad event." }, { status: 400 });
  const profile = await getProfile(user.id);
  const supabase = await createClient();
  await supabase.from("v2_prompt_events").insert({
    user_id: user.id,
    prompt_id: promptId,
    event_date: localDate(profile.timezone),
    kind: body.kind,
  });
  return new NextResponse(null, { status: 204 });
}
