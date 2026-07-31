// Vipps Recurring (faste avtaler + trekk), partner-bevisst.
//
// Egen API fra ePayment: en AVTALE (agreement) godkjennes én gang av medlemmet,
// og deretter opprettes TREKK (charges) per periode. Vipps trekker automatisk
// på forfallsdato. Nye trekk må opprettes i forkant (se cron-jobben), siden
// Vipps ikke lager dem selv.
//
// Deler nøkler, MSN-oppslag og access-token med ePayment-modulen (vipps.ts).

import { BASE, baseHeaders, getAccessToken, idempotencyKey } from "@/server/vipps";
import type { AgreementInterval } from "@prisma/client";

// Vipps krever DIRECT_CAPTURE (trekkes på forfall) eller RESERVE_CAPTURE.
// For kontingent/givertjeneste vil vi trekke direkte.
const TRANSACTION_TYPE = "DIRECT_CAPTURE" as const;

// Vipps forfallsdato skrives som ren dato (yyyy-MM-dd), uten klokkeslett.
function toDueDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function intervalUnit(interval: AgreementInterval): "MONTH" | "YEAR" {
  return interval === "YEAR" ? "YEAR" : "MONTH";
}

export type VippsAgreementStatus = "PENDING" | "ACTIVE" | "STOPPED" | "EXPIRED";

// Vipps charge-statuser vi bryr oss om (se recurring/v3-dok)
export type VippsChargeStatus =
  | "PENDING"
  | "DUE"
  | "RESERVED"
  | "CHARGED"
  | "PARTIALLY_CAPTURED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PROCESSING";

// Oppretter en avtale (draft) og returnerer godkjennings-URL til Vipps.
// initialCharge trekker første periode med en gang avtalen godkjennes.
export async function createAgreement(params: {
  msn: string;
  amountOre: number;
  interval: AgreementInterval;
  productName: string;
  description: string;
  merchantRedirectUrl: string;
  merchantAgreementUrl: string;
  /**
   * Our own durable id for this agreement, used as the idempotency key.
   *
   * Without it a retry creates a SECOND agreement, and the member is charged
   * twice every period for the rest of the subscription.
   */
  operationId: string;
}): Promise<{ agreementId: string; vippsConfirmationUrl: string; chargeId?: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/recurring/v3/agreements`, {
    method: "POST",
    headers: {
      ...baseHeaders(params.msn),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey("agreement", params.operationId),
    },
    body: JSON.stringify({
      pricing: {
        type: "LEGACY",
        amount: params.amountOre,
        currency: "NOK",
      },
      interval: { unit: intervalUnit(params.interval), count: 1 },
      merchantRedirectUrl: params.merchantRedirectUrl,
      merchantAgreementUrl: params.merchantAgreementUrl,
      productName: params.productName.slice(0, 45),
      productDescription: params.description.slice(0, 100),
      // Trekk første periode straks avtalen er godkjent
      initialCharge: {
        amount: params.amountOre,
        description: params.description.slice(0, 45),
        transactionType: TRANSACTION_TYPE,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Vipps createAgreement feilet: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as {
    agreementId: string;
    vippsConfirmationUrl: string;
    chargeId?: string;
  };
}

type VippsAgreementInfo = {
  id: string;
  status: VippsAgreementStatus;
};

export async function getAgreement(
  msn: string,
  agreementId: string,
): Promise<VippsAgreementInfo> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/recurring/v3/agreements/${agreementId}`, {
    headers: { ...baseHeaders(msn), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(
      `Vipps getAgreement feilet: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as VippsAgreementInfo;
}

// Stopper (sier opp) en avtale. Fremtidige trekk uteblir.
export async function stopAgreement(
  msn: string,
  agreementId: string,
): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/recurring/v3/agreements/${agreementId}`, {
    method: "PATCH",
    headers: {
      ...baseHeaders(msn),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // One stop per agreement, so the agreement id identifies it.
      "Idempotency-Key": idempotencyKey("stop", agreementId),
    },
    body: JSON.stringify({ status: "STOPPED" }),
  });
  if (!res.ok) {
    throw new Error(
      `Vipps stopAgreement feilet: ${res.status} ${await res.text()}`,
    );
  }
}

// Oppretter et trekk på en avtale. `reference` gjør kallet idempotent
// (settes som Idempotency-Key), så en ny cron-kjøring ikke dobbelttrekker.
export async function createCharge(params: {
  msn: string;
  agreementId: string;
  reference: string;
  amountOre: number;
  due: Date;
  description: string;
}): Promise<{ chargeId: string }> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/recurring/v3/agreements/${params.agreementId}/charges`,
    {
      method: "POST",
      headers: {
        ...baseHeaders(params.msn),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.reference,
      },
      body: JSON.stringify({
        amount: params.amountOre,
        transactionType: TRANSACTION_TYPE,
        description: params.description.slice(0, 45),
        due: toDueDate(params.due),
        retryDays: 5,
        orderId: params.reference,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Vipps createCharge feilet: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as { chargeId: string };
}

type VippsChargeInfo = {
  id: string;
  status: VippsChargeStatus;
  amount: number;
};

export async function getCharge(
  msn: string,
  agreementId: string,
  chargeId: string,
): Promise<VippsChargeInfo> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/recurring/v3/agreements/${agreementId}/charges/${chargeId}`,
    { headers: { ...baseHeaders(msn), Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(
      `Vipps getCharge feilet: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as VippsChargeInfo;
}

// Shared helper for charge capture/refund/cancel.
async function modifyCharge(
  msn: string,
  agreementId: string,
  chargeId: string,
  action: "capture" | "refund" | "cancel",
  operationId: string,
  amountOre?: number,
): Promise<void> {
  const token = await getAccessToken();
  const method = action === "cancel" ? "DELETE" : "POST";
  const url =
    action === "cancel"
      ? `${BASE}/recurring/v3/agreements/${agreementId}/charges/${chargeId}`
      : `${BASE}/recurring/v3/agreements/${agreementId}/charges/${chargeId}/${action}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...baseHeaders(msn),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Same rule as for ePayment: a retry must carry the key of the attempt
      // it repeats, or Vipps treats it as a second charge modification.
      "Idempotency-Key": idempotencyKey(action, operationId),
    },
    body:
      amountOre !== undefined
        ? JSON.stringify({ amount: amountOre, description: action })
        : undefined,
  });
  if (!res.ok) {
    throw new Error(
      `Vipps charge ${action} failed: ${res.status} ${await res.text()}`,
    );
  }
}

// Capture a reserved charge.
export function captureCharge(
  msn: string,
  agreementId: string,
  chargeId: string,
  amountOre: number,
) {
  return modifyCharge(msn, agreementId, chargeId, "capture", chargeId, amountOre);
}

// Refund a captured charge (partial or full).
export function refundCharge(
  msn: string,
  agreementId: string,
  chargeId: string,
  amountOre: number,
) {
  return modifyCharge(msn, agreementId, chargeId, "refund", chargeId, amountOre);
}

// Cancel a charge that has not been captured yet.
export function cancelCharge(
  msn: string,
  agreementId: string,
  chargeId: string,
) {
  return modifyCharge(msn, agreementId, chargeId, "cancel", chargeId);
}

// Neste forfallsdato ut fra intervall
export function addInterval(from: Date, interval: AgreementInterval): Date {
  const d = new Date(from);
  if (interval === "YEAR") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}
