import "server-only";
import { Resend } from "resend";

/** Dev safety: only addresses in EMAIL_ALLOWLIST ever receive mail. Empty allowlist = nobody. */
export function isAllowed(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = (process.env.EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The prompt itself is the subject line: the question is the hook people see before they open it. */
export function reminderSubject(promptText: string): string {
  return promptText.length > 80 ? `${promptText.slice(0, 79).trimEnd()}…` : promptText;
}

export async function sendReminder(to: string, promptText: string, appUrl: string, answers = 0) {
  if (!isAllowed(to)) return { skipped: true as const };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "Prompted <onboarding@resend.dev>";
  const tally = answers > 0 ? `You’ve written ${answers} ${answers === 1 ? "answer" : "answers"} so far.` : "";
  const settingsUrl = `${appUrl}/settings`;
  const { error } = await resend.emails.send({
    from,
    to,
    subject: reminderSubject(promptText),
    text: `${promptText}\n\nA few minutes. No wrong answer, only yours.\n${appUrl}\n${tally ? `\n${tally}\n` : ""}\nTurn these off any time: ${settingsUrl}`,
    html: `<div style="display:none;max-height:0;overflow:hidden;opacity:0">A few minutes. No wrong answer, only yours.</div>
<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#1f2421">
<p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#3e5c4c">Today</p>
<p style="font-size:26px;line-height:1.3;margin:12px 0 28px">${esc(promptText)}</p>
<a href="${appUrl}" style="font-family:Arial,sans-serif;background:#3e5c4c;color:#f7f8f5;padding:12px 22px;border-radius:999px;text-decoration:none">Start writing</a>
<p style="font-family:Arial,sans-serif;font-size:14px;color:#4a514c;margin-top:28px">A few minutes. No wrong answer, only yours.${tally ? ` ${tally}` : ""}</p>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#5f6661;margin-top:20px">Turn these off any time in <a href="${settingsUrl}" style="color:#5f6661">Settings</a>.</p></div>`,
  });
  if (error) throw new Error(error.message);
  return { skipped: false as const };
}
