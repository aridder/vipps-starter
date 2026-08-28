import { z } from "zod";
import { isEnabled } from "@/lib/features";
import {
  createTRPCRouter,
  paymentAdminProcedure,
} from "@/server/api/trpc";
import { resolveMsn } from "@/server/vipps";
import { getReportOverview } from "@/server/vipps-report";
import { TRPCError } from "@trpc/server";

export const reportRouter = createTRPCRouter({
  overview: paymentAdminProcedure
    .input(
      z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!isEnabled("reports")) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const organization = ctx.orgId
        ? await ctx.db.organization.findUnique({
            where: { id: ctx.orgId },
            select: { vippsMsn: true },
          })
        : null;
      const msn = resolveMsn(organization?.vippsMsn);
      if (!msn) {
        return {
          available: false as const,
          date: input.date ?? todayInOslo(),
          reasonCode: "missingMsn" as const,
        };
      }
      return getReportOverview(msn, input.date ?? todayInOslo());
    }),
});

function todayInOslo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
