import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  paymentAdminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { resolveMsn, vippsConfigured } from "@/server/vipps";
import {
  cancelCharge,
  captureCharge,
  createAgreement,
  refundCharge,
  stopAgreement,
} from "@/server/vipps-recurring";
import { syncAgreementStatus } from "@/server/agreements";
import { AgreementInterval, PaymentPurpose, Role } from "@prisma/client";
import {
  hashAnalyticsId,
  trackProductEvent,
} from "@/lib/server-telemetry";
import { resolveSite } from "@/lib/site";

// Load an org-scoped agreement + a charge + the MSN, for admin charge actions.
async function loadChargeForAdmin(
  ctx: { db: import("@prisma/client").PrismaClient; orgId: string | null },
  agreementId: string,
  chargeId: string,
) {
  const agreement = await ctx.db.agreement.findUnique({
    where: { id: agreementId },
  });
  if (!agreement || agreement.orgId !== ctx.orgId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  const charge = await ctx.db.agreementCharge.findFirst({
    where: { id: chargeId, agreementId },
  });
  if (!charge?.vippsId) throw new TRPCError({ code: "NOT_FOUND" });
  const org = agreement.orgId
    ? await ctx.db.organization.findUnique({
        where: { id: agreement.orgId },
        select: { vippsMsn: true },
      })
    : null;
  const msn = resolveMsn(org?.vippsMsn);
  if (!msn) throw new TRPCError({ code: "PRECONDITION_FAILED" });
  return { agreement, charge, msn };
}

function baseUrl(headers: Headers): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const proto = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("host") ?? "";
  return `${proto}://${host}`;
}

const RECURRING_PURPOSE = z.enum([
  PaymentPurpose.SUBSCRIPTION,
  PaymentPurpose.DONATION,
]);

export const subscriptionRouter = createTRPCRouter({
  available: publicProcedure.query(async ({ ctx }) => {
    if (!vippsConfigured()) return { available: false };
    const org = ctx.orgId
      ? await ctx.db.organization.findUnique({
          where: { id: ctx.orgId },
          select: { vippsMsn: true },
        })
      : null;
    return { available: !!resolveMsn(org?.vippsMsn) };
  }),

  create: protectedProcedure
    .input(
      z.object({
        purpose: RECURRING_PURPOSE,
        amountKr: z.number().int().min(1).max(100000),
        interval: z.nativeEnum(AgreementInterval),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!vippsConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Vipps payments are not configured yet.",
        });
      }
      const org = ctx.orgId
        ? await ctx.db.organization.findUnique({
            where: { id: ctx.orgId },
            select: { vippsMsn: true },
          })
        : null;
      const msn = resolveMsn(org?.vippsMsn);
      if (!msn) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This organization has not set up Vipps yet.",
        });
      }

      const siteName = resolveSite().name;
      const labels: Record<string, string> = {
        SUBSCRIPTION: "Subscription",
        DONATION: `Fast støtte til ${siteName}`.slice(0, 100),
      };
      const intervalWord = input.interval === "YEAR" ? "årlig" : "månedlig";
      const productName = labels[input.purpose] ?? "Subscription";
      const description = `${productName} (${intervalWord})`;
      const amountOre = input.amountKr * 100;

      const agreementId = crypto.randomUUID();

      let vipps;
      try {
        vipps = await createAgreement({
          msn,
          amountOre,
          interval: input.interval,
          productName,
          description,
          merchantRedirectUrl: `${baseUrl(ctx.headers)}/billing/subscription/receipt?id=${agreementId}`,
          merchantAgreementUrl: `${baseUrl(ctx.headers)}/billing`,
          // Our own id for the agreement, so a retry cannot create a second
          // one that charges the member twice every period.
          operationId: agreementId,
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: e instanceof Error ? e.message : "Vipps error",
        });
      }

      await ctx.db.agreement.create({
        data: {
          id: agreementId,
          vippsId: vipps.agreementId,
          purpose: input.purpose,
          interval: input.interval,
          amountOre,
          description,
          orgId: ctx.orgId,
          userId: ctx.userId,
        },
      });

      if (vipps.chargeId) {
        await ctx.db.agreementCharge.create({
          data: {
            agreementId,
            vippsId: vipps.chargeId,
            reference: `sub-${agreementId}-initial`,
            amountOre,
            due: new Date(),
            status: "PENDING",
          },
        });
      }

      trackProductEvent(
        "subscription.started",
        { billingMode: "recurring" },
        { actorIdHash: hashAnalyticsId("user", ctx.userId) },
      );
      return { confirmationUrl: vipps.vippsConfirmationUrl, id: agreementId };
    }),

  status: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.agreement.findUnique({
        where: { id: input.id },
        select: { userId: true, status: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin =
        ctx.roles.includes(Role.ADMIN) || ctx.roles.includes(Role.OWNER);
      if (existing.userId !== ctx.userId && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const agreement = await syncAgreementStatus(ctx.db, input.id);
      return agreement;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.agreement.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
    });
  }),

  all: paymentAdminProcedure.query(async ({ ctx }) => {
    const agreements = await ctx.db.agreement.findMany({
      where: { orgId: ctx.orgId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const active = agreements.filter((a) => a.status === "ACTIVE");
    return { agreements, activeCount: active.length };
  }),

  // Charges (periods) for one agreement — admin
  charges: paymentAdminProcedure
    .input(z.object({ agreementId: z.string() }))
    .query(async ({ ctx, input }) => {
      const agreement = await ctx.db.agreement.findUnique({
        where: { id: input.agreementId },
        select: { orgId: true },
      });
      if (!agreement || agreement.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.agreementCharge.findMany({
        where: { agreementId: input.agreementId },
        orderBy: { createdAt: "desc" },
      });
    }),

  captureCharge: paymentAdminProcedure
    .input(z.object({ agreementId: z.string(), chargeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { agreement, charge, msn } = await loadChargeForAdmin(
        ctx,
        input.agreementId,
        input.chargeId,
      );
      await captureCharge(msn, agreement.vippsId, charge.vippsId!, charge.amountOre);
      return syncAgreementStatus(ctx.db, agreement.id);
    }),

  refundCharge: paymentAdminProcedure
    .input(
      z.object({
        agreementId: z.string(),
        chargeId: z.string(),
        amountKr: z.number().int().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { agreement, charge, msn } = await loadChargeForAdmin(
        ctx,
        input.agreementId,
        input.chargeId,
      );
      const amount = input.amountKr ? input.amountKr * 100 : charge.amountOre;
      await refundCharge(msn, agreement.vippsId, charge.vippsId!, amount);
      return syncAgreementStatus(ctx.db, agreement.id);
    }),

  cancelCharge: paymentAdminProcedure
    .input(z.object({ agreementId: z.string(), chargeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { agreement, charge, msn } = await loadChargeForAdmin(
        ctx,
        input.agreementId,
        input.chargeId,
      );
      await cancelCharge(msn, agreement.vippsId, charge.vippsId!);
      return syncAgreementStatus(ctx.db, agreement.id);
    }),

  stop: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const agreement = await ctx.db.agreement.findUnique({
        where: { id: input.id },
      });
      if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin =
        ctx.roles.includes(Role.ADMIN) || ctx.roles.includes(Role.OWNER);
      if (agreement.userId !== ctx.userId && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const org = agreement.orgId
        ? await ctx.db.organization.findUnique({
            where: { id: agreement.orgId },
            select: { vippsMsn: true },
          })
        : null;
      const msn = resolveMsn(org?.vippsMsn);

      if (msn) {
        try {
          await stopAgreement(msn, agreement.vippsId);
        } catch (e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              e instanceof Error ? e.message : "Could not stop the subscription",
          });
        }
      }

      return ctx.db.agreement.update({
        where: { id: agreement.id },
        data: { status: "STOPPED", nextChargeDate: null },
      });
    }),
});
