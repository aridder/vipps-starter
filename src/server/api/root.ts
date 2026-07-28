import { createTRPCRouter } from "@/server/api/trpc";
import { metaRouter } from "@/server/api/routers/meta";
import { orgRouter } from "@/server/api/routers/org";
import { paymentRouter } from "@/server/api/routers/payment";
import { subscriptionRouter } from "@/server/api/routers/subscription";
import { notificationRouter } from "@/server/api/routers/notification";
import { analyticsRouter } from "@/server/api/routers/analytics";
import { reportRouter } from "@/server/api/routers/report";

export const appRouter = createTRPCRouter({
  analytics: analyticsRouter,
  meta: metaRouter,
  org: orgRouter,
  payment: paymentRouter,
  report: reportRouter,
  subscription: subscriptionRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
