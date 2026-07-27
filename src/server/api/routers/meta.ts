import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { Role } from "@prisma/client";
import { resolveFeatures } from "@/lib/features";
import { resolveSite } from "@/lib/site";
import { vippsConfigured } from "@/server/vipps";

export const metaRouter = createTRPCRouter({
  // Branding/marketing config, resolved at runtime from env (see src/lib/site.ts)
  site: publicProcedure.query(() => resolveSite()),

  // Feature flags + capability info for the client
  features: publicProcedure.query(() => {
    const features = resolveFeatures();
    return {
      ...features,
      // payments/recurring also require Vipps keys to actually work
      vippsReady: vippsConfigured(),
    };
  }),

  // Signed-in user with roles for the active org — drives admin UI
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, name: true, email: true, image: true },
    });
    return {
      ...user,
      roles: ctx.roles,
      orgId: ctx.orgId,
      isAdmin:
        ctx.roles.includes(Role.ADMIN) || ctx.roles.includes(Role.OWNER),
      isOwner: ctx.roles.includes(Role.OWNER),
    };
  }),
});
