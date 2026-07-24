import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { Role } from "@prisma/client";
import { vippsConfigured } from "@/server/vipps";
import {
  deleteWebhook,
  deleteWebhooksForUrl,
  registerWebhook,
} from "@/server/vipps-webhooks";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

function baseUrl(headers: Headers): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const proto = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("host") ?? "";
  return `${proto}://${host}`;
}

const ASSIGNABLE_ROLES: Role[] = [Role.MEMBER, Role.ADMIN, Role.OWNER];

export const orgRouter = createTRPCRouter({
  // Orgs the user is a member of + which is active
  mine: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { userId: ctx.userId },
      include: { org: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "asc" },
    });
    return {
      activeOrgId: ctx.orgId,
      orgs: memberships.map((m) => ({
        id: m.org.id,
        name: m.org.name,
        slug: m.org.slug,
        roles: m.roles,
      })),
    };
  }),

  setActive: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.membership.findUnique({
        where: { userId_orgId: { userId: ctx.userId, orgId: input.orgId } },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: { activeOrgId: input.orgId },
      });
      return { ok: true };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const base = slugify(input.name);
      let slug = base;
      for (
        let i = 2;
        await ctx.db.organization.findUnique({ where: { slug } });
        i++
      ) {
        slug = `${base}-${i}`;
      }
      const org = await ctx.db.organization.create({
        data: { name: input.name, slug },
      });
      await ctx.db.membership.create({
        data: {
          userId: ctx.userId,
          orgId: org.id,
          roles: [Role.MEMBER, Role.ADMIN, Role.OWNER],
        },
      });
      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: { activeOrgId: org.id },
      });
      return org;
    }),

  // Settings for the active org (admin)
  settings: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) return null;
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        vippsMsn: true,
        vippsWebhookId: true,
      },
    });
    if (!org) return null;
    const { vippsWebhookId, ...rest } = org;
    return {
      ...rest,
      vippsPlatformReady: vippsConfigured(),
      vippsConnected: !!vippsWebhookId,
    };
  }),

  updateInfo: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(120),
        vippsMsn: z
          .string()
          .max(20)
          .regex(/^\d*$/, "MSN is digits only")
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: "BAD_REQUEST" });
      return ctx.db.organization.update({
        where: { id: ctx.orgId },
        data: { name: input.name, vippsMsn: input.vippsMsn || null },
      });
    }),

  // ── Vipps connection (partner onboarding) ─────────────────────────────
  connectVipps: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: "BAD_REQUEST" });
    if (!vippsConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Platform is missing Vipps keys.",
      });
    }
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.orgId },
      select: { vippsMsn: true, vippsWebhookId: true },
    });
    if (!org?.vippsMsn) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Set the organization's MSN first, then save.",
      });
    }

    const msn = org.vippsMsn;
    const url = `${baseUrl(ctx.headers)}/api/vipps/webhook`;

    if (org.vippsWebhookId) {
      try {
        await deleteWebhook(msn, org.vippsWebhookId);
      } catch {
        // best effort
      }
    }
    await deleteWebhooksForUrl(msn, url);

    let registration;
    try {
      registration = await registerWebhook(msn, url);
    } catch (e) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          e instanceof Error
            ? e.message
            : "Could not register Vipps webhook. Check the MSN.",
      });
    }

    await ctx.db.organization.update({
      where: { id: ctx.orgId },
      data: {
        vippsWebhookId: registration.id,
        vippsWebhookSecret: registration.secret,
      },
    });
    return { connected: true };
  }),

  disconnectVipps: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: "BAD_REQUEST" });
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.orgId },
      select: { vippsMsn: true, vippsWebhookId: true },
    });
    if (org?.vippsMsn && org.vippsWebhookId) {
      try {
        await deleteWebhook(org.vippsMsn, org.vippsWebhookId);
      } catch {
        // best effort — we clear locally regardless
      }
    }
    await ctx.db.organization.update({
      where: { id: ctx.orgId },
      data: { vippsWebhookId: null, vippsWebhookSecret: null },
    });
    return { connected: false };
  }),

  // ── Members & roles (admin) ───────────────────────────────────────────
  members: adminProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { orgId: ctx.orgId ?? "" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      roles: m.roles,
    }));
  }),

  setRoles: adminProcedure
    .input(z.object({ userId: z.string(), roles: z.array(z.nativeEnum(Role)) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: "BAD_REQUEST" });
      const roles = input.roles.filter((r) => ASSIGNABLE_ROLES.includes(r));
      if (!roles.includes(Role.MEMBER)) roles.unshift(Role.MEMBER);
      await ctx.db.membership.update({
        where: { userId_orgId: { userId: input.userId, orgId: ctx.orgId } },
        data: { roles },
      });
      return { ok: true };
    }),

  addMember: adminProcedure
    .input(
      z.object({ email: z.string().email(), name: z.string().max(80).optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: "BAD_REQUEST" });
      const email = input.email.trim().toLowerCase();
      const user = await ctx.db.user.upsert({
        where: { email },
        update: {},
        create: { email, name: input.name?.trim() || email.split("@")[0] },
      });
      await ctx.db.membership.upsert({
        where: { userId_orgId: { userId: user.id, orgId: ctx.orgId } },
        update: {},
        create: { userId: user.id, orgId: ctx.orgId, roles: [Role.MEMBER] },
      });
      return { ok: true };
    }),

  removeMember: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: "BAD_REQUEST" });
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself.",
        });
      }
      await ctx.db.membership.deleteMany({
        where: { userId: input.userId, orgId: ctx.orgId },
      });
      return { ok: true };
    }),
});
