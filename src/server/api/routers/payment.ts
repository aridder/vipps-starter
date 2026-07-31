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
  getPayment,
  getPaymentEvents,
  oneLineReceipt,
  refundPayment,
  resolveMsn,
  vippsApiStatus,
  vippsConfigured,
} from "@/server/vipps";
import {
  expressShipping,
  getExpressProduct,
} from "@/server/vipps-express";
import { syncPaymentStatus } from "@/server/payments";
import { TRPCError as _TRPCError } from "@trpc/server";
import { PaymentPurpose } from "@prisma/client";
import {
  hashAnalyticsId,
  trackProductEvent,
} from "@/lib/server-telemetry";
import { resolveSite } from "@/lib/site";

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
        description: z.string().min(3).max(100).optional(),
        flow: z.enum(["WEB_REDIRECT", "QR"]).default("WEB_REDIRECT"),
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
      if (input.flow === "QR" && !isEnabled("paymentQr")) {
        throw new TRPCError({ code: "NOT_FOUND" });
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
        DONATION: `Støtte til ${resolveSite().name}`.slice(0, 100),
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
        const receiptUrl = `${baseUrl(ctx.headers)}/billing/receipt?ref=${reference}`;
        const { redirectUrl } = await createPayment({
          msn,
          reference,
          amountOre: payment.amountOre,
          description,
          returnUrl: receiptUrl,
          flow: input.flow,
          receipt: oneLineReceipt({
            reference,
            name: description,
            amountOre: payment.amountOre,
            // Vipps requires a public secure product URL. Local test origins are
            // intentionally omitted from the customer receipt.
            productUrl: receiptUrl.startsWith("https://")
              ? receiptUrl
              : undefined,
          }),
        });
        trackProductEvent(
          "billing.started",
          {
            billingMode: "one_time",
            captureMode: payment.autoCapture ? "auto" : "reserve",
            userFlow: input.flow,
          },
          ctx.session?.user?.id
            ? { actorIdHash: hashAnalyticsId("user", ctx.session.user.id) }
            : {},
        );
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

  createExpress: publicProcedure.mutation(async ({ ctx }) => {
    if (!isEnabled("paymentExpress")) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    const product = getExpressProduct();
    if (!product) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Express-produktet er ikke konfigurert.",
      });
    }
    const apiStatus = await vippsApiStatus();
    if (!apiStatus.available) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: apiStatus.reason,
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
        message: "Organisasjonen mangler Vipps MSN.",
      });
    }

    const reference = `exp-${crypto.randomUUID()}`;
    const payment = await ctx.db.payment.create({
      data: {
        reference,
        purpose: PaymentPurpose.ONE_TIME,
        amountOre: product.priceOre,
        description: product.description,
        orgId: ctx.orgId,
        userId: ctx.session?.user?.id,
        autoCapture: true,
      },
    });
    try {
      const result = await createPayment({
        msn,
        reference,
        amountOre: product.priceOre,
        description: product.description,
        returnUrl: `${baseUrl(ctx.headers)}/billing/receipt?ref=${reference}`,
        shipping: expressShipping(product),
      });
      trackProductEvent(
        "billing.started",
        { billingMode: "express", productId: product.id },
        ctx.session?.user?.id
          ? { actorIdHash: hashAnalyticsId("user", ctx.session.user.id) }
          : {},
      );
      return { ...result, reference };
    } catch (error) {
      await ctx.db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Vipps-feil",
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
    if (!vippsConfigured()) {
      return {
        available: false,
        reason: "Vipps-nøkler mangler.",
        express: null,
      };
    }
    const org = ctx.orgId
      ? await ctx.db.organization.findUnique({
          where: { id: ctx.orgId },
          select: { vippsMsn: true },
        })
      : null;
    if (!resolveMsn(org?.vippsMsn)) {
      return {
        available: false,
        reason: "Organisasjonen mangler Vipps MSN.",
        express: null,
      };
    }
    const status = await vippsApiStatus();
    const express = isEnabled("paymentExpress") ? getExpressProduct() : null;
    return {
      ...status,
      express: express
        ? {
            id: express.id,
            name: express.name,
            description: express.description,
            priceOre: express.priceOre,
            shippingOre: express.shippingOre,
            shippingName: express.shippingName,
          }
        : null,
    };
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

  details: paymentAdminProcedure
    .input(z.object({ reference: z.string() }))
    .query(async ({ ctx, input }) => {
      const { msn } = await loadPaymentForAdmin(ctx, input.reference);
      const [payment, events] = await Promise.all([
        getPayment(msn, input.reference),
        getPaymentEvents(msn, input.reference),
      ]);
      return {
        state: payment.state,
        shippingDetails: payment.shippingDetails ?? null,
        userDetails: payment.userDetails ?? null,
        events: events
          .slice()
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .slice(0, 30),
      };
    }),

  // ── Admin actions (capture / refund / cancel) ─────────────────────────
  //
  // All three sync with Vipps BEFORE deciding how much to move. Our own
  // captured/refunded numbers can be stale — a refund made in the Vipps
  // portal never passed through this app — and acting on stale numbers means
  // asking to give back more than is left.
  //
  // The idempotency key is derived from how much has already been settled.
  // An automatic retry sees the same numbers and therefore sends the same
  // key, so Vipps recognises it as a repeat instead of paying out twice.
  capture: paymentAdminProcedure
    .input(
      z.object({ reference: z.string(), amountKr: z.number().int().min(1).optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { msn } = await loadPaymentForAdmin(ctx, input.reference);
      const payment = await syncPaymentStatus(ctx.db, input.reference);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      const remaining = payment.amountOre - payment.capturedOre;
      if (remaining <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This payment is already captured in full.",
        });
      }
      const amount = input.amountKr ? input.amountKr * 100 : remaining;
      if (amount > remaining) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `At most ${remaining / 100} kr is left to capture.`,
        });
      }
      await capturePayment(
        msn,
        input.reference,
        amount,
        `${input.reference}-${payment.capturedOre}`,
      );
      return syncPaymentStatus(ctx.db, input.reference);
    }),

  refund: paymentAdminProcedure
    .input(
      z.object({ reference: z.string(), amountKr: z.number().int().min(1).optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { msn } = await loadPaymentForAdmin(ctx, input.reference);
      const payment = await syncPaymentStatus(ctx.db, input.reference);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      const refundable = payment.capturedOre - payment.refundedOre;
      // Refusing here rather than letting Vipps reject it: an opaque API
      // error is a bad way to learn that the money is already back.
      if (refundable <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "There is nothing left to refund on this payment.",
        });
      }
      const amount = input.amountKr ? input.amountKr * 100 : refundable;
      if (amount > refundable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `At most ${refundable / 100} kr can be refunded.`,
        });
      }
      await refundPayment(
        msn,
        input.reference,
        amount,
        `${input.reference}-${payment.refundedOre}`,
      );
      return syncPaymentStatus(ctx.db, input.reference);
    }),

  cancel: paymentAdminProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { msn } = await loadPaymentForAdmin(ctx, input.reference);
      // Cancel releases a reservation, so there is exactly one of them per
      // payment: the reference alone identifies the operation.
      await cancelPayment(msn, input.reference, input.reference);
      return syncPaymentStatus(ctx.db, input.reference);
    }),
});
