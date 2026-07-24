// Vipps Webhooks — registrering per MSN (partner-onboarding).
//
// I partner-modell registrerer plattformen én webhook per klubb (per MSN) slik
// at Vipps sender sanntidshendelser (betaling autorisert/trukket, avtale aktiv,
// trekk gjennomført osv.) til appen. Vår webhook-handler bruker hendelsen kun
// som en TRIGGER og henter alltid autoritativ status fra Vipps — pollingen i
// cron er backup om en hendelse skulle glippe.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { BASE, baseHeaders, getAccessToken } from "@/server/vipps";

// Hendelser vi vil bli varslet om. Handleren re-henter status uansett, så
// listen styrer bare HVA vi vekkes av — ikke hva vi stoler på.
const EVENTS = [
  // ePayment
  "epayments.payment.authorized.v1",
  "epayments.payment.captured.v1",
  "epayments.payment.aborted.v1",
  "epayments.payment.expired.v1",
  "epayments.payment.terminated.v1",
  // Recurring
  "recurring.agreement-activated.v1",
  "recurring.agreement-rejected.v1",
  "recurring.agreement-stopped.v1",
  "recurring.agreement-expired.v1",
  "recurring.charge-reserved.v1",
  "recurring.charge-captured.v1",
  "recurring.charge-failed.v1",
];

type WebhookRegistration = { id: string; secret: string };
type WebhookSummary = { id: string; url: string };

// Registrer en webhook for et gitt MSN. Returnerer id + secret (secret lagres
// for framtidig signaturverifisering).
export async function registerWebhook(
  msn: string,
  url: string,
): Promise<WebhookRegistration> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/webhooks/v1/webhooks`, {
    method: "POST",
    headers: {
      ...baseHeaders(msn),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, events: EVENTS }),
  });
  if (!res.ok) {
    throw new Error(
      `Vipps registerWebhook feilet: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as WebhookRegistration;
}

export async function listWebhooks(msn: string): Promise<WebhookSummary[]> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/webhooks/v1/webhooks`, {
    headers: { ...baseHeaders(msn), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(
      `Vipps listWebhooks feilet: ${res.status} ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { webhooks?: WebhookSummary[] };
  return data.webhooks ?? [];
}

export async function deleteWebhook(msn: string, id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/webhooks/v1/webhooks/${id}`, {
    method: "DELETE",
    headers: { ...baseHeaders(msn), Authorization: `Bearer ${token}` },
  });
  // 204 = slettet, 404 = fantes ikke (begge greit)
  if (!res.ok && res.status !== 404) {
    throw new Error(
      `Vipps deleteWebhook feilet: ${res.status} ${await res.text()}`,
    );
  }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Verifiserer Vipps sin webhook-signatur (HMAC-SHA256 over metode, sti, dato,
// host og innholds-hash), slik Vipps beskriver. Nøkkelen er webhook-secreten
// vi fikk ved registrering. Returnerer true når signaturen stemmer.
//
// Merk: dette er et EKSTRA lag. Handleren henter uansett autoritativ status
// fra Vipps, så en forfalsket melding kan ikke fake en betaling – men med
// signaturvalidering avviser vi tull før vi bruker ressurser på oppslag.
export function verifyVippsSignature(params: {
  method: string;
  pathAndQuery: string;
  host: string;
  xMsDate: string;
  contentSha256: string | null;
  authorization: string | null;
  rawBody: string;
  secret: string;
}): boolean {
  if (!params.authorization || !params.xMsDate || !params.host) return false;

  const contentHash = createHash("sha256")
    .update(params.rawBody, "utf8")
    .digest("base64");

  // Hvis Vipps sendte innholds-hash, må den matche kroppen vi mottok
  if (params.contentSha256 && params.contentSha256 !== contentHash) {
    return false;
  }

  const signedString = `${params.method}\n${params.pathAndQuery}\n${params.xMsDate};${params.host};${contentHash}`;
  const signature = createHmac("sha256", params.secret)
    .update(signedString, "utf8")
    .digest("base64");
  const expected = `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`;

  return safeEqual(expected, params.authorization);
}

// Rydder bort eventuelle gamle webhooks som peker på samme URL for dette MSN-et,
// så vi ikke hoper opp duplikater ved re-tilkobling.
export async function deleteWebhooksForUrl(
  msn: string,
  url: string,
): Promise<void> {
  let existing: WebhookSummary[];
  try {
    existing = await listWebhooks(msn);
  } catch {
    return; // klarer vi ikke liste, hopper vi bare over oppryddingen
  }
  for (const w of existing) {
    if (w.url === url) {
      try {
        await deleteWebhook(msn, w.id);
      } catch {
        // ignorer — beste innsats
      }
    }
  }
}
