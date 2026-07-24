// Vipps ePayment (engangsbetaling), partner-bevisst.
//
// Partner-modell (prod): plattformen bruker PARTNER-nøkler (client_id/secret +
// subscription key) og setter Merchant-Serial-Number til den enkelte klubbens
// MSN per betaling. Pengene går rett til klubben.
//
// Enkel-merchant (test/én klubb): fall tilbake til VIPPS_API_CLIENT_ID/SECRET
// og VIPPS_MSN.
//
// Partner-nøkler virker kun i produksjon hos Vipps — test kjøres med vanlige
// merchant-testnøkler.

export const BASE = process.env.VIPPS_API_BASE ?? "https://apitest.vipps.no";
const SUB_KEY = process.env.VIPPS_SUBSCRIPTION_KEY ?? "";

// Partner-nøkler har forrang; ellers enkel-merchant-nøkler
const CLIENT_ID =
  process.env.VIPPS_PARTNER_CLIENT_ID ?? process.env.VIPPS_API_CLIENT_ID ?? "";
const CLIENT_SECRET =
  process.env.VIPPS_PARTNER_CLIENT_SECRET ??
  process.env.VIPPS_API_CLIENT_SECRET ??
  "";

// Standard-MSN (enkel-merchant). I partner-modell settes MSN per bane.
const DEFAULT_MSN = process.env.VIPPS_MSN ?? "";

// Har vi nok til å snakke med Vipps i det hele tatt?
export function vippsConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && SUB_KEY);
}

// Hvilket MSN skal brukes for en gitt bane? (banens eget, ellers standard)
export function resolveMsn(courseMsn?: string | null): string | null {
  return courseMsn || DEFAULT_MSN || null;
}

// Delte Vipps-headere. Brukes av både ePayment og Recurring.
export function baseHeaders(msn: string): Record<string, string> {
  return {
    "Ocp-Apim-Subscription-Key": SUB_KEY,
    "Merchant-Serial-Number": msn,
    "Vipps-System-Name": "dg-dugnad",
    "Vipps-System-Version": "1.0",
    "Vipps-System-Plugin-Name": "dg-dugnad",
    "Vipps-System-Plugin-Version": "1.0",
  };
}

export async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE}/accesstoken/get`, {
    method: "POST",
    headers: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      "Ocp-Apim-Subscription-Key": SUB_KEY,
    },
  });
  if (!res.ok) {
    throw new Error(`Vipps accesstoken feilet: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export type VippsPaymentState =
  | "CREATED"
  | "AUTHORIZED"
  | "TERMINATED"
  | "ABORTED"
  | "EXPIRED";

// Oppretter en betaling for et gitt MSN og returnerer redirect-URL til Vipps
export async function createPayment(params: {
  msn: string;
  reference: string;
  amountOre: number;
  description: string;
  returnUrl: string;
}): Promise<{ redirectUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/epayment/v1/payments`, {
    method: "POST",
    headers: {
      ...baseHeaders(params.msn),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: { currency: "NOK", value: params.amountOre },
      paymentMethod: { type: "WALLET" },
      reference: params.reference,
      userFlow: "WEB_REDIRECT",
      returnUrl: params.returnUrl,
      paymentDescription: params.description.slice(0, 100),
    }),
  });
  if (!res.ok) {
    throw new Error(`Vipps createPayment feilet: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { redirectUrl: string };
}

type VippsPaymentInfo = {
  state: VippsPaymentState;
  aggregate?: {
    authorizedAmount?: { value: number };
    capturedAmount?: { value: number };
    cancelledAmount?: { value: number };
    refundedAmount?: { value: number };
  };
};

export async function getPayment(
  msn: string,
  reference: string,
): Promise<VippsPaymentInfo> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/epayment/v1/payments/${reference}`, {
    headers: { ...baseHeaders(msn), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Vipps getPayment feilet: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as VippsPaymentInfo;
}

// Shared helper for capture/refund/cancel modification calls.
async function modifyPayment(
  msn: string,
  reference: string,
  action: "capture" | "refund" | "cancel",
  amountOre?: number,
): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/epayment/v1/payments/${reference}/${action}`,
    {
      method: "POST",
      headers: {
        ...baseHeaders(msn),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body:
        amountOre !== undefined
          ? JSON.stringify({
              modificationAmount: { currency: "NOK", value: amountOre },
            })
          : undefined,
    },
  );
  if (!res.ok) {
    throw new Error(`Vipps ${action} failed: ${res.status} ${await res.text()}`);
  }
}

// Capture an authorized (reserved) amount.
export function capturePayment(msn: string, reference: string, amountOre: number) {
  return modifyPayment(msn, reference, "capture", amountOre);
}

// Refund a captured amount (partial or full).
export function refundPayment(msn: string, reference: string, amountOre: number) {
  return modifyPayment(msn, reference, "refund", amountOre);
}

// Cancel releases a reservation that has not been captured.
export function cancelPayment(msn: string, reference: string) {
  return modifyPayment(msn, reference, "cancel");
}
