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

export async function sendReminder(to: string, promptText: string, appUrl: string) {
  if (!isAllowed(to)) return { skipped: true as const };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "Prompted <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Today’s prompt",
    text: `${promptText}\n\nNo wrong answer, only yours.\n${appUrl}\n\nTurn these off any time in Settings.`,
    html: `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#1f2421">
<p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#3e5c4c">Today</p>
<p style="font-size:26px;line-height:1.3;margin:12px 0 28px">${promptText.replace(/</g, "&lt;")}</p>
<a href="${appUrl}" style="font-family:Arial,sans-serif;background:#3e5c4c;color:#f7f8f5;padding:12px 22px;border-radius:999px;text-decoration:none">Start writing</a>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#5f6661;margin-top:32px">No wrong answer, only yours. Turn these off any time in Settings.</p></div>`,
  });
  if (error) throw new Error(error.message);
  return { skipped: false as const };
}
