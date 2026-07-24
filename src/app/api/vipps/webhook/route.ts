import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { syncPaymentStatus } from "@/server/payments";
import { syncAgreementStatus } from "@/server/agreements";
import { verifyVippsSignature } from "@/server/vipps-webhooks";

// Sørg for Node-runtime (node:crypto brukes til signaturvalidering)
export const runtime = "nodejs";

type WebhookBody = {
  // ePayment pakker referansen ulikt avhengig av hendelsestype
  reference?: string;
  payment?: { reference?: string };
  data?: { reference?: string; agreementId?: string; chargeId?: string };
  // Recurring
  agreementId?: string;
  chargeId?: string;
  eventType?: string;
  event?: string;
};

// Finn webhook-secreten for klubben hendelsen gjelder. Vi bruker id-ene i
// meldingen kun til å SLÅ OPP hvilken klubb – selve tilliten kommer fra at
// HMAC-signaturen må stemme med nettopp den klubbens lagrede secret.
async function findWebhookSecret(
  agreementVippsId: string | undefined,
  reference: string | undefined,
): Promise<string | null> {
  if (agreementVippsId) {
    const a = await db.agreement.findUnique({
      where: { vippsId: agreementVippsId },
      select: { org: { select: { vippsWebhookSecret: true } } },
    });
    return a?.org?.vippsWebhookSecret ?? null;
  }
  if (reference) {
    const p = await db.payment.findUnique({
      where: { reference },
      select: { org: { select: { vippsWebhookSecret: true } } },
    });
    return p?.org?.vippsWebhookSecret ?? null;
  }
  return null;
}

// Vipps-webhook (ePayment + Recurring). Hendelsen er en TRIGGER; faktisk status
// hentes autentisert fra Vipps. I partner-modell er samme URL registrert per
// klubb-MSN, hver med sin egen signatur-secret.
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "ugyldig body" }, { status: 400 });
  }

  const event = body.eventType ?? body.event ?? "";
  const agreementVippsId = body.agreementId ?? body.data?.agreementId;
  const reference =
    body.reference ?? body.payment?.reference ?? body.data?.reference;

  // Signaturvalidering (ekstra lag). Har vi en secret for denne klubben,
  // sjekker vi HMAC-signaturen. VIKTIG: som standard er dette WARN-modus —
  // vi logger avvik, men prosesserer likevel, fordi statussynken uansett
  // henter autoritativ status fra Vipps (en forfalsket melding kan ikke fake
  // en betaling). Slik kan ikke en liten signatur-avvik brekke sanntidsflyten.
  //
  // Sett VIPPS_WEBHOOK_ENFORCE_SIGNATURE="true" for å håndheve (svar 401 ved
  // avvik) – gjør det først når prod-loggen bekrefter at ekte signaturer går
  // gjennom.
  const enforce = process.env.VIPPS_WEBHOOK_ENFORCE_SIGNATURE === "true";
  const secret = await findWebhookSecret(agreementVippsId, reference);
  if (secret) {
    const url = new URL(request.url);
    const ok = verifyVippsSignature({
      method: "POST",
      pathAndQuery: url.pathname + url.search,
      host: request.headers.get("host") ?? url.host,
      xMsDate: request.headers.get("x-ms-date") ?? "",
      contentSha256: request.headers.get("x-ms-content-sha256"),
      authorization: request.headers.get("authorization"),
      rawBody,
      secret,
    });
    if (!ok) {
      console.warn(
        `Vipps webhook: signatur stemte ikke (event=${event || "ukjent"}, enforce=${enforce})`,
      );
      if (enforce) {
        return NextResponse.json(
          { error: "ugyldig signatur" },
          { status: 401 },
        );
      }
      // Warn-modus: fortsett – re-henting av status er autoritativt uansett.
    }
  }

  try {
    if (agreementVippsId || event.startsWith("recurring")) {
      if (agreementVippsId) {
        const agreement = await db.agreement.findUnique({
          where: { vippsId: agreementVippsId },
          select: { id: true },
        });
        if (agreement) await syncAgreementStatus(db, agreement.id);
      }
    } else if (reference) {
      await syncPaymentStatus(db, reference);
    }
  } catch (e) {
    // 200 så Vipps ikke spammer retries; cron/polling er backup uansett
    console.error("Webhook-behandling feilet:", e);
  }

  return NextResponse.json({ ok: true });
}
