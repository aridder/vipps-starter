import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  paymentAdminProcedure,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { isEnabled } from "@/lib/features";
import {
  cancelPayment,
  capturePayment,
  createPayment,
  refundPayment,
  resolveMsn,
  vippsConfigured,
} from "@/server/vipps";
import { syncPaymentStatus } from "@/server/payments";
import { TRPCError as _TRPCError } from "@trpc/server";
import { PaymentPurpose } from "@prisma/client";

// Load an org-scoped payment + its MSN, or throw. Used by admin actions.
async function loadPaymentForAdmin(
  ctx: { db: import("@prisma/client").PrismaClient; orgId: string | null },
  reference: string,
) {
  const payment = await ctx.db.payment.findUnique({ where: { reference } });
  if (!payment || payment.orgId !== ctx.orgId) {
    throw new _TRPCError({ code: "NOT_FOUND" });
  }
  const org = payment.orgId
    ? await ctx.db.organization.findUnique({
        where: { id: payment.orgId },
        select: { vippsMsn: true },
      })
    : null;
  const msn = resolveMsn(org?.vippsMsn);
  if (!msn) {
    throw new _TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Vipps is not set up for this organization.",
    });
  }
  return { payment, msn };
}

function baseUrl(headers: Headers): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const proto = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("host") ?? "";
  return `${proto}://${host}`;
}

// One-off payments (subscriptions live in the `subscription` router)
const ONE_OFF_PURPOSE = z.enum([
  PaymentPurpose.ONE_TIME,
  PaymentPurpose.DONATION,
]);

export const paymentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        purpose: ONE_OFF_PURPOSE,
        amountKr: z.number().int().min(1).max(100000),
        description: z.string().max(100).optional(),
        // "reserve" holds the funds for an admin to capture later.
        capture: z.enum(["auto", "reserve"]).default("auto"),
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

      const labels: Record<string, string> = {
        ONE_TIME: "Payment",
        DONATION: "Donation",
      };
      const description = input.description || labels[input.purpose] || "Payment";
      const reference = `pay-${crypto.randomUUID()}`;

      const payment = await ctx.db.payment.create({
        data: {
          reference,
          purpose: input.purpose,
          amountOre: input.amountKr * 100,
          description,
          orgId: ctx.orgId,
          userId: ctx.session?.user?.id,
          // Reserve (hold funds for later capture) only when the billing admin
          // feature is enabled; otherwise always auto-capture.
          autoCapture: !(
            input.capture === "reserve" && isEnabled("paymentAdmin")
          ),
        },
      });

      try {
        const { redirectUrl } = await createPayment({
          msn,
          reference,
          amountOre: payment.amountOre,
          description,
          returnUrl: `${baseUrl(ctx.headers)}/billing/receipt?ref=${reference}`,
        });
        return { redirectUrl, reference };
      } catch (e) {
        await ctx.db.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: e instanceof Error ? e.message : "Vipps error",
        });
      }
    }),

  status: publicProcedure
    .input(z.object({ reference: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await syncPaymentStatus(ctx.db, input.reference);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      return payment;
    }),

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

  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.payment.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }),

  all: paymentAdminProcedure.query(async ({ ctx }) => {
    const payments = await ctx.db.payment.findMany({
      where: { orgId: ctx.orgId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const capturedKr =
      payments.reduce((s, p) => s + p.capturedOre, 0) / 100;
    const refundedKr =
      payments.reduce((s, p) => s + p.refundedOre, 0) / 100;
    const netKr = capturedKr - refundedKr;
    return {
      payments,
      capturedKr,
      refundedKr,
      netKr,
      paidCount: payments.filter((p) => p.status === "PAID").length,
      reservedCount: payments.filter((p) => p.status === "AUTHORIZED").length,
    };
  }),

  // ── Admin actions (capture / refund / cancel) ─────────────────────────
  capture: paymentAdminProcedure
    .input(
      z.object({ reference: z.string(), amountKr: z.number().int().min(1).optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { payment, msn } = await loadPaymentForAdmin(ctx, input.reference);
      const remaining = payment.amountOre - payment.capturedOre;
      const amount = input.amountKr ? input.amountKr * 100 : remaining;
      await capturePayment(msn, input.reference, amount);
      return syncPaymentStatus(ctx.db, input.reference);
    }),

  refund: paymentAdminProcedure
    .input(
      z.object({ reference: z.string(), amountKr: z.number().int().min(1).optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { payment, msn } = await loadPaymentForAdmin(ctx, input.reference);
      const refundable = payment.capturedOre - payment.refundedOre;
      const amount = input.amountKr ? input.amountKr * 100 : refundable;
      await refundPayment(msn, input.reference, amount);
      return syncPaymentStatus(ctx.db, input.reference);
    }),

  cancel: paymentAdminProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { msn } = await loadPaymentForAdmin(ctx, input.reference);
      await cancelPayment(msn, input.reference);
      return syncPaymentStatus(ctx.db, input.reference);
    }),
});
