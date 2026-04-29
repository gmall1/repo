import { Resend } from "resend";

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!emailEnabled()) {
    console.log("[email:skipped]", opts.subject, "->", opts.to);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@example.com",
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}
