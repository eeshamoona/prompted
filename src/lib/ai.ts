import "server-only";
import OpenAI from "openai";
import type { Persona } from "@/lib/data";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";

export const PERSONAS: Record<Persona, { label: string; description: string; tone: string }> = {
  muse: {
    label: "Muse",
    description: "Delights in your ideas and sparks the next one",
    tone: "playful and imaginative; you delight in their ideas and may end with one curious what-if",
  },
  cheerleader: {
    label: "Cheerleader",
    description: "Warm encouragement that celebrates you",
    tone: "warm and celebratory; you notice what they did well and say so with genuine enthusiasm",
  },
  coach: {
    label: "Coach",
    description: "A kind note plus one thing to try next time",
    tone: "kind and practical; one genuine compliment, then one small, specific idea to try next time",
  },
  critic: {
    label: "Honest reader",
    description: "Thoughtful, candid reactions",
    tone: "candid but kind; say honestly what landed and what you wanted more of",
  },
  editor: {
    label: "Editor",
    description: "Notices craft: word choice and rhythm",
    tone: "attentive to craft; you notice a strong word choice or rhythm and name it",
  },
  guru: {
    label: "Guru",
    description: "A gentle question for deeper reflection",
    tone: "calm and reflective; you reflect back what you heard and leave one gentle question",
  },
};

const NUDGE_INSTRUCTIONS = `You help someone keep writing their own answer to a creative prompt when they feel stuck.
Return ONLY a short sentence fragment (4 to 12 words) that continues naturally from the very end of their text.
Rules:
- Match their voice, tense, and point of view. Never introduce a new topic.
- Leave the fragment unfinished so THEY complete the thought. Never end with a period.
- Do not repeat their words. No quotation marks, no preamble, no explanation.
- If their text is empty, offer an inviting first few words for answering the prompt.
- If their text ends mid-word, start with a space only if a new word begins.`;

export async function nudge(prompt: string, text: string): Promise<string> {
  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: "none" },
    instructions: NUDGE_INSTRUCTIONS,
    input: `Prompt: ${prompt}\n\nTheir text so far:\n${text || "(nothing yet)"}`,
    max_output_tokens: 60,
  });
  let fragment = response.output_text.trim().replace(/^["“]|["”]$/g, "").replace(/[.!?]+$/, "");
  if (!fragment) throw new Error("Empty nudge");
  // Join cleanly with the existing text.
  if (text && !/\s$/.test(text) && !/^[,;:)]/.test(fragment)) fragment = " " + fragment;
  return fragment;
}

export async function reaction(prompt: string, text: string, persona: Persona): Promise<string> {
  const p = PERSONAS[persona] ?? PERSONAS.muse;
  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: "none" },
    instructions: `You are a reader responding to someone's short creative answer to a daily prompt. Your voice: ${p.tone}.
Write 2 or 3 sentences, under 60 words, addressed to them as "you".
Rules:
- Quote or echo ONE specific phrase they wrote, so they know you really read it.
- End with exactly ONE short, curious question that invites them to say a little more about THEIR answer (in your voice). It must be the last sentence.
- Never give a score, grade, or rating. Never rewrite their answer or tell them it is "good writing" generically.
- There is no wrong answer to the prompt; react to what makes THEIR answer theirs.
- If the answer is very short, be just as warm and briefer.`,
    input: `Prompt: ${prompt}\n\nTheir answer:\n${text}`,
    max_output_tokens: 160,
  });
  return response.output_text.trim();
}

/** The reader's last word after the writer answers their question: warm, brief, and no new question. */
export async function closingNote(question: string, reply: string, persona: Persona): Promise<string> {
  const p = PERSONAS[persona] ?? PERSONAS.muse;
  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: "none" },
    instructions: `You asked someone a question about their creative answer, and they replied. Your voice: ${p.tone}.
Write ONE sentence, under 30 words, that warmly closes the exchange.
Rules:
- Echo one specific phrase from their reply.
- Do NOT ask a question. Do not use a question mark. Do not invite more writing.
- No scores, no advice, no rewriting.`,
    input: `Your question: ${question}\n\nTheir reply:\n${reply}`,
    max_output_tokens: 80,
  });
  // Guarantee the exchange ends here even if the model slips in a question.
  return response.output_text.trim().replace(/\?+(["”’)]*)\s*$/, ".$1");
}

/** Three short sample answers in distinct voices, so a prompt never looks empty before friends share. */
export async function sampleAnswers(prompt: string): Promise<string> {
  const { SAMPLE_VOICES } = await import("@/lib/samples");
  const voices = SAMPLE_VOICES.map((v, i) => `${i + 1}. ${v.label}: ${v.style}`).join("\n");
  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: "none" },
    instructions: `Write three short sample answers to a playful creative writing prompt, one per voice, in this order:
${voices}
Rules:
- 50 to 90 words each, first person, plain everyday language.
- Each takes a genuinely different angle on the prompt. No wrong answer.
- Warm and light; nothing sad, scary or heavy. No real people, brands, or copyrighted characters.
Return ONLY a JSON array of three objects: [{"title": "2 to 5 word title", "text": "the answer"}].`,
    input: `Prompt: ${prompt}`,
    max_output_tokens: 700,
  });
  return response.output_text;
}
