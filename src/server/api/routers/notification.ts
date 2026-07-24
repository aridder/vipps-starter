import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { userId: ctx.userId, read: false },
    });
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: { id: input.id, userId: ctx.userId },
        data: { read: true },
      });
      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: { userId: ctx.userId, read: false },
      data: { read: true },
    });
    return { ok: true };
  }),

  // Register a Web Push subscription (from the browser Push API)
  registerPush: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        update: { p256dh: input.p256dh, auth: input.auth, userId: ctx.userId },
        create: { ...input, userId: ctx.userId },
      });
      return { ok: true };
    }),

  unregisterPush: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pushSubscription.deleteMany({
        where: { endpoint: input.endpoint, userId: ctx.userId },
      });
      return { ok: true };
    }),
});
