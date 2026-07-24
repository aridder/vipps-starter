import type {
  Agreement,
  AgreementCharge,
  AgreementStatus,
  PrismaClient,
} from "@prisma/client";
import { resolveMsn, vippsConfigured } from "@/server/vipps";
import {
  addInterval,
  createCharge,
  getAgreement,
  getCharge,
} from "@/server/vipps-recurring";
import { notifyOrgAdmins, notifyUsers } from "@/server/notify";

// Days before due that we create the charge at Vipps.
const LEAD_DAYS = 3;
// Vipps requires the due date to be a couple of days ahead.
const MIN_DUE_DAYS = 3;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function msnForAgreement(
  db: PrismaClient,
  agreement: Pick<Agreement, "orgId">,
): Promise<string | null> {
  const org = agreement.orgId
    ? await db.organization.findUnique({
        where: { id: agreement.orgId },
        select: { vippsMsn: true },
      })
    : null;
  return resolveMsn(org?.vippsMsn);
}

const CHARGE_DONE = new Set(["CHARGED", "CANCELLED", "FAILED", "REFUNDED"]);

/**
 * Mirrors one charge's status from Vipps (authoritative). When the charge is
 * completed (CHARGED) it is booked as a Payment (PAID) so it shows up in the
 * normal payment overview. `reference` is unique, so a Payment is created at
 * most once per charge.
 */
export async function syncChargeStatus(
  db: PrismaClient,
  agreement: Agreement,
  charge: AgreementCharge,
  msn: string,
): Promise<void> {
  if (!charge.vippsId) return;
  if (CHARGE_DONE.has(charge.status)) return;

  let info;
  try {
    info = await getCharge(msn, agreement.vippsId, charge.vippsId);
  } catch (e) {
    console.error("Vipps charge sync failed:", e);
    return;
  }
  if (info.status === charge.status) return;

  await db.agreementCharge.update({
    where: { id: charge.id },
    data: { status: info.status },
  });

  if (info.status === "CHARGED") {
    await db.payment.upsert({
      where: { reference: charge.reference },
      update: { status: "PAID", vippsState: "CHARGED" },
      create: {
        reference: charge.reference,
        purpose: agreement.purpose,
        amountOre: charge.amountOre,
        description: agreement.description,
        orgId: agreement.orgId,
        userId: agreement.userId,
        agreementId: agreement.id,
        status: "PAID",
        vippsState: "CHARGED",
      },
    });
    await notifyOrgAdmins(db, agreement.orgId, {
      type: "PAYMENT",
      title: `Recurring charge received: ${charge.amountOre / 100} kr`,
      body: agreement.description,
      link: "/billing/overview",
    });
  }
}

const AGREEMENT_STATES: Record<string, AgreementStatus> = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  STOPPED: "STOPPED",
  EXPIRED: "EXPIRED",
};

/**
 * Fetches agreement status from Vipps, updates our Agreement, and syncs all its
 * charges. The first time an agreement becomes ACTIVE, the next charge is
 * scheduled one interval ahead (the initial charge covers the current period).
 */
export async function syncAgreementStatus(
  db: PrismaClient,
  id: string,
): Promise<Agreement | null> {
  const agreement = await db.agreement.findUnique({ where: { id } });
  if (!agreement) return null;
  if (!vippsConfigured()) return agreement;
  if (agreement.status === "STOPPED" || agreement.status === "EXPIRED") {
    return agreement;
  }

  const msn = await msnForAgreement(db, agreement);
  if (!msn) return agreement;

  let current = agreement;
  try {
    const info = await getAgreement(msn, agreement.vippsId);
    const newStatus = AGREEMENT_STATES[info.status] ?? agreement.status;
    if (newStatus !== agreement.status) {
      const becameActive =
        newStatus === "ACTIVE" && agreement.status !== "ACTIVE";
      current = await db.agreement.update({
        where: { id: agreement.id },
        data: {
          status: newStatus,
          ...(becameActive && !agreement.nextChargeDate
            ? { nextChargeDate: addInterval(new Date(), agreement.interval) }
            : {}),
        },
      });
      if (becameActive) {
        await notifyUsers(db, [agreement.userId], {
          type: "PAYMENT",
          title: "Subscription active 🎉",
          body: agreement.description,
          link: "/billing",
        });
      }
    }
  } catch (e) {
    console.error("Vipps agreement sync failed:", e);
  }

  const charges = await db.agreementCharge.findMany({
    where: { agreementId: agreement.id },
  });
  for (const c of charges) {
    await syncChargeStatus(db, current, c, msn);
  }

  return current;
}

/**
 * Cron engine: find active agreements due soon and create charges at Vipps.
 * Idempotent on `reference` (per due date) + the Vipps Idempotency-Key, so
 * repeated runs never double-charge. Also syncs outstanding charges.
 */
export async function processDueCharges(db: PrismaClient): Promise<{
  created: number;
  synced: number;
  skipped: number;
}> {
  let created = 0;
  let synced = 0;
  let skipped = 0;

  if (!vippsConfigured()) return { created, synced, skipped };

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + LEAD_DAYS);

  const due = await db.agreement.findMany({
    where: {
      status: "ACTIVE",
      nextChargeDate: { not: null, lte: horizon },
    },
  });

  for (const agreement of due) {
    const msn = await msnForAgreement(db, agreement);
    if (!msn || !agreement.nextChargeDate) {
      skipped++;
      continue;
    }

    const minDue = new Date(now);
    minDue.setDate(minDue.getDate() + MIN_DUE_DAYS);
    const dueDate =
      agreement.nextChargeDate > minDue ? agreement.nextChargeDate : minDue;

    const reference = `sub-${agreement.id}-${ymd(agreement.nextChargeDate)}`;

    const existing = await db.agreementCharge.findUnique({
      where: { reference },
    });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      const { chargeId } = await createCharge({
        msn,
        agreementId: agreement.vippsId,
        reference,
        amountOre: agreement.amountOre,
        due: dueDate,
        description: agreement.description,
      });

      await db.$transaction([
        db.agreementCharge.create({
          data: {
            agreementId: agreement.id,
            vippsId: chargeId,
            reference,
            amountOre: agreement.amountOre,
            due: dueDate,
            status: "PENDING",
          },
        }),
        db.agreement.update({
          where: { id: agreement.id },
          data: {
            nextChargeDate: addInterval(
              agreement.nextChargeDate,
              agreement.interval,
            ),
          },
        }),
      ]);
      created++;
    } catch (e) {
      console.error(`Charge for agreement ${agreement.id} failed:`, e);
      skipped++;
    }
  }

  const open = await db.agreementCharge.findMany({
    where: { status: { notIn: ["CHARGED", "CANCELLED", "FAILED", "REFUNDED"] } },
    include: { agreement: true },
  });
  for (const c of open) {
    const msn = await msnForAgreement(db, c.agreement);
    if (!msn) continue;
    await syncChargeStatus(db, c.agreement, c, msn);
    synced++;
  }

  return { created, synced, skipped };
}
