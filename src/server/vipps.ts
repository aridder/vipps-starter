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
    "Vipps-System-Name": "vipps-starter",
    "Vipps-System-Version": "1.0",
    "Vipps-System-Plugin-Name": "vipps-starter",
    "Vipps-System-Plugin-Version": "1.0",
  };
}

let tokenCache: { token: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    const res = await fetch(`${BASE}/accesstoken/get`, {
      method: "POST",
      headers: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        "Ocp-Apim-Subscription-Key": SUB_KEY,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Vipps access token feilet (${res.status}): ${safeVippsError(body)}`,
      );
    }
    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
    };
    // Renew early and cap the local cache so revoked access is noticed quickly.
    const ttlSeconds = Math.min(data.expires_in ?? 900, 600);
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(60, ttlSeconds - 30) * 1000,
    };
    return data.access_token;
  })();

  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

function safeVippsError(body: string): string {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const candidate =
      parsed.title ?? parsed.code ?? parsed.error ?? parsed.detail ?? "ukjent feil";
    return String(candidate).slice(0, 160);
  } catch {
    return "ukjent feil";
  }
}

export async function vippsApiStatus(): Promise<{
  available: boolean;
  reason?: string;
}> {
  if (!vippsConfigured()) {
    return { available: false, reason: "Vipps-nøkler mangler." };
  }
  try {
    await getAccessToken();
    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason:
        error instanceof Error
          ? error.message
          : "Vipps kunne ikke bekrefte API-tilgang.",
    };
  }
}

export type VippsPaymentState =
  | "CREATED"
  | "AUTHORIZED"
  | "TERMINATED"
  | "ABORTED"
  | "EXPIRED";

export type VippsReceipt = {
  orderLines: Array<{
    name: string;
    id: string;
    totalAmount: number;
    totalAmountExcludingTax: number;
    totalTaxAmount: number;
    taxRate: number;
    isShipping?: boolean;
    productUrl?: string;
  }>;
  bottomLine: {
    currency: "NOK";
    receiptNumber: string;
  };
};

type VippsShipping = {
  fixedOptions: Array<{
    type: "HOME_DELIVERY" | "PICKUP_POINT" | "MAILBOX" | "IN_STORE" | "OTHER";
    brand:
      | "BRING"
      | "DHL"
      | "FEDEX"
      | "GLS"
      | "HELTHJEM"
      | "INSTABOX"
      | "MATKAHUOLTO"
      | "PORTERBUDDY"
      | "POSTEN"
      | "POSTI"
      | "POSTNORD"
      | "OTHER";
    isDefault?: boolean;
    priority?: number;
    options: Array<{
      id: string;
      amount: { currency: "NOK"; value: number };
      name: string;
      isDefault?: boolean;
      priority?: number;
      estimatedDelivery?: string;
      meta?: string;
    }>;
  }>;
  allowedCountries?: string[];
};

export function oneLineReceipt(params: {
  reference: string;
  name: string;
  amountOre: number;
  productUrl?: string;
}): VippsReceipt {
  return {
    orderLines: [
      {
        name: params.name.slice(0, 100),
        id: params.reference,
        totalAmount: params.amountOre,
        totalAmountExcludingTax: params.amountOre,
        totalTaxAmount: 0,
        taxRate: 0,
        ...(params.productUrl ? { productUrl: params.productUrl } : {}),
      },
    ],
    bottomLine: {
      currency: "NOK",
      receiptNumber: params.reference,
    },
  };
}

// Creates WEB_REDIRECT, QR, or Express ePayment using the same authoritative
// payment object. QR returns a Vipps-hosted image URL in redirectUrl.
export async function createPayment(params: {
  msn: string;
  reference: string;
  amountOre: number;
  description: string;
  returnUrl: string;
  flow?: "WEB_REDIRECT" | "QR";
  receipt?: VippsReceipt;
  shipping?: VippsShipping;
}): Promise<{ redirectUrl: string }> {
  const token = await getAccessToken();
  const flow = params.flow ?? "WEB_REDIRECT";
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
      userFlow: flow,
      returnUrl: params.returnUrl,
      paymentDescription: params.description.slice(0, 100),
      ...(flow === "QR"
        ? {
            customerInteraction: "CUSTOMER_PRESENT",
            qrFormat: { format: "IMAGE/PNG", size: 1024 },
          }
        : {}),
      ...(params.receipt ? { receipt: params.receipt } : {}),
      ...(params.shipping
        ? {
            shipping: params.shipping,
            profile: { scope: "name address email phoneNumber" },
          }
        : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Vipps createPayment feilet (${res.status}): ${safeVippsError(await res.text())}`,
    );
  }
  const data = (await res.json()) as {
    redirectUrl?: string;
    reference: string;
  };
  if (!data.redirectUrl) {
    throw new Error("Vipps returnerte ingen URL for betalingsflyten.");
  }
  const url = new URL(data.redirectUrl);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".vipps.no")) {
    throw new Error("Vipps returnerte en uventet betalings-URL.");
  }
  return { redirectUrl: data.redirectUrl };
}

export type VippsPaymentInfo = {
  state: VippsPaymentState;
  aggregate?: {
    authorizedAmount?: { value: number };
    capturedAmount?: { value: number };
    cancelledAmount?: { value: number };
    refundedAmount?: { value: number };
  };
  shippingDetails?: {
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      country?: string;
      postCode?: string;
    };
    shippingCost?: number;
    shippingOptionId?: string;
    shippingOptionName?: string;
  };
  userDetails?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
  };
};

export type VippsPaymentEvent = {
  reference: string;
  pspReference?: string;
  name: string;
  amount?: { currency: string; value: number };
  timestamp: string;
  success: boolean;
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

export async function getPaymentEvents(
  msn: string,
  reference: string,
): Promise<VippsPaymentEvent[]> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/epayment/v1/payments/${reference}/events`, {
    headers: { ...baseHeaders(msn), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(
      `Vipps event log feilet (${res.status}): ${safeVippsError(await res.text())}`,
    );
  }
  return (await res.json()) as VippsPaymentEvent[];
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
