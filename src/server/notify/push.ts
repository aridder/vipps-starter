// Web Push provider — abstraction with a no-op stub.
//
// Uses the standard Web Push protocol (VAPID). Wire the `web-push` package (or
// your own sender) here. Subscriptions are stored in the PushSubscription model.
// Gated by the `push` feature flag upstream.

export type PushTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
};

export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.log(`[push:stub] endpoint=${target.endpoint.slice(0, 32)}…`);
    return;
  }

  // TODO: wire the `web-push` package:
  //   import webpush from "web-push";
  //   webpush.setVapidDetails(process.env.VAPID_SUBJECT!, publicKey, privateKey);
  //   await webpush.sendNotification(
  //     { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
  //     JSON.stringify(payload),
  //   );
  console.log(`[push] endpoint=${target.endpoint.slice(0, 32)}…`);
}
