import { createTRPCRouter } from "@/server/api/trpc";
import { metaRouter } from "@/server/api/routers/meta";
import { orgRouter } from "@/server/api/routers/org";
import { paymentRouter } from "@/server/api/routers/payment";
import { subscriptionRouter } from "@/server/api/routers/subscription";
import { notificationRouter } from "@/server/api/routers/notification";

export const appRouter = createTRPCRouter({
  meta: metaRouter,
  org: orgRouter,
  payment: paymentRouter,
  subscription: subscriptionRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
