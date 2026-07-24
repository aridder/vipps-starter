// SMS provider — abstraction with a no-op stub.
//
// Wire your provider (Twilio, Vonage, LINK Mobility …). Until credentials are
// set the message is logged. Gated by the `sms` feature flag upstream.

export type SmsMessage = {
  to: string; // E.164, e.g. +4790000000
  body: string;
};

export async function sendSms(msg: SmsMessage): Promise<void> {
  const sid = process.env.SMS_ACCOUNT_SID;
  const from = process.env.SMS_FROM;

  if (!sid || !from) {
    console.log(`[sms:stub] to=${msg.to} body="${msg.body.slice(0, 40)}…"`);
    return;
  }

  // TODO: replace with a real provider call, e.g. Twilio Messages API.
  console.log(`[sms] from=${from} to=${msg.to}`);
}
