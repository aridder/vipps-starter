// Email provider — abstraction with a no-op stub.
//
// Wire your provider of choice here (Resend, Postmark, SMTP via nodemailer …).
// Until an API key is configured the message is logged, so local dev and CI
// work without external services. Gated by the `email` feature flag upstream.

export type EmailMessage = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM ?? "no-reply@example.com";

  if (!apiKey) {
    console.log(`[email:stub] to=${msg.to} subject="${msg.subject}"`);
    return;
  }

  // TODO: replace with a real provider call, e.g. Resend:
  //   await fetch("https://api.resend.com/emails", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  //     body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html ?? msg.text }),
  //   });
  console.log(`[email] from=${from} to=${msg.to} subject="${msg.subject}"`);
}
