import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { isEnabled } from "@/lib/features";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  // Resolve active org + roles for that org
  let orgId: string | null = null;
  let roles: Role[] = [];

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        activeOrgId: true,
        memberships: { select: { orgId: true, roles: true } },
      },
    });
    if (user) {
      const memberOrgIds = user.memberships.map((m) => m.orgId);
      orgId =
        user.activeOrgId && memberOrgIds.includes(user.activeOrgId)
          ? user.activeOrgId
          : (memberOrgIds[0] ?? null);
      roles = user.memberships.find((m) => m.orgId === orgId)?.roles ?? [];
    }
  }

  // Fallback (logged out / no membership): oldest org as default tenant
  if (!orgId) {
    const first = await db.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    orgId = first?.id ?? null;
  }

  return { db, session, orgId, roles, ...opts };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
      userId: ctx.session.user.id,
    },
  });
});

// Admin on the active org (ADMIN or OWNER)
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const ok = ctx.roles.includes(Role.ADMIN) || ctx.roles.includes(Role.OWNER);
  if (!ok) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requires admin access on this organization.",
    });
  }
  return next();
});

// Admin billing console (refunds, reserve/capture, charge ops). Gated by the
// `paymentAdmin` feature flag, which is OFF by default — these operations stay
// unusable until an operator explicitly enables them.
export const paymentAdminProcedure = adminProcedure.use(({ next }) => {
  if (!isEnabled("paymentAdmin")) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Billing admin is disabled.",
    });
  }
  return next();
});
