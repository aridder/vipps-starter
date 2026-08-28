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

  // Signed-in user with roles for the active org — drives admin UI.
  //
  // Public rather than protected, returning null when logged out: the nav and
  // the donation widget ask "who is this?" on every page including the public
  // landing page, and as a protected procedure that answered every anonymous
  // visitor with a 401 in the console. The data is still gated — a logged-out
  // caller learns nothing but `null`.
  me: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) return null;
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
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
