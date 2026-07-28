import type { PaymentStatus, PrismaClient } from "@prisma/client";
import {
  capturePayment,
  getPayment,
  resolveMsn,
  vippsConfigured,
} from "@/server/vipps";
import { notifyOrgAdmins } from "@/server/notify";
import {
  hashAnalyticsId,
  trackProductEvent,
} from "@/lib/server-telemetry";

/**
 * Fetches the authoritative payment status from Vipps and updates our Payment.
 * Honors reserve/capture: auto-captures on authorization unless `autoCapture`
 * is false, in which case the payment stays RESERVED (AUTHORIZED) for an admin
 * to capture later. Tracks captured/refunded amounts. Used by the status query,
 * the webhook, and after admin capture/refund/cancel actions — the truth always
 * comes from an authenticated Vipps call.
 */
export async function syncPaymentStatus(db: PrismaClient, reference: string) {
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return null;

  // Truly terminal states need no re-check
  if (
    payment.status === "REFUNDED" ||
    payment.status === "CANCELLED" ||
    payment.status === "FAILED"
  ) {
    return payment;
  }
  if (!vippsConfigured()) return payment;

  const org = payment.orgId
    ? await db.organization.findUnique({
        where: { id: payment.orgId },
        select: { vippsMsn: true },
      })
    : null;
  const msn = resolveMsn(org?.vippsMsn);
  if (!msn) return payment;

  let newStatus: PaymentStatus = payment.status;
  let capturedOre = payment.capturedOre;
  let refundedOre = payment.refundedOre;
  let amountOre = payment.amountOre;
  let vippsState: string | undefined;

  try {
    const info = await getPayment(msn, reference);
    vippsState = info.state;
    capturedOre = info.aggregate?.capturedAmount?.value ?? capturedOre;
    refundedOre = info.aggregate?.refundedAmount?.value ?? refundedOre;
    const authorizedOre = info.aggregate?.authorizedAmount?.value;
    // Express adds the selected shipping option during authorization. Persist
    // Vipps' final authorized total so capture, refund and admin KPIs stay exact.
    if (authorizedOre && authorizedOre > amountOre) amountOre = authorizedOre;

    if (info.state === "AUTHORIZED") {
      if (payment.autoCapture && capturedOre < amountOre) {
        await capturePayment(msn, reference, amountOre - capturedOre);
        capturedOre = amountOre;
      }
      if (capturedOre > 0) {
        newStatus =
          refundedOre > 0 && refundedOre >= capturedOre ? "REFUNDED" : "PAID";
      } else {
        newStatus = "AUTHORIZED"; // reserved, awaiting capture
      }
    } else if (info.state === "ABORTED") {
      newStatus = "CANCELLED";
    } else if (info.state === "TERMINATED") {
      newStatus =
        capturedOre > 0
          ? refundedOre >= capturedOre
            ? "REFUNDED"
            : "PAID"
          : "CANCELLED";
    } else if (info.state === "EXPIRED") {
      newStatus = "FAILED";
    } else {
      newStatus = "CREATED";
    }
  } catch (e) {
    console.error("Vipps status check failed:", e);
    return payment;
  }

  const update = {
    status: newStatus,
    vippsState,
    amountOre,
    capturedOre,
    refundedOre,
  };
  const completedNow =
    newStatus === "PAID" && payment.status !== "PAID"
      ? (
          await db.payment.updateMany({
            where: { id: payment.id, status: { not: "PAID" } },
            data: update,
          })
        ).count === 1
      : false;
  if (!completedNow) {
    await db.payment.update({ where: { id: payment.id }, data: update });
  }
  const updated = await db.payment.findUniqueOrThrow({
    where: { id: payment.id },
  });

  if (completedNow) {
    await notifyOrgAdmins(db, payment.orgId, {
      type: "PAYMENT",
      title: `Payment received: ${capturedOre / 100} kr`,
      body: payment.description,
      link: "/billing/admin",
    });
    trackProductEvent(
      "billing.completed",
      { billingMode: "one_time" },
      payment.userId
        ? { actorIdHash: hashAnalyticsId("user", payment.userId) }
        : {},
    );
  }

  return updated;
}
