import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { Role } from "@prisma/client";
import { db } from "@/server/db";
import {
  hashAnalyticsId,
  trackProductEvent,
} from "@/lib/server-telemetry";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Roles at login: email in ADMIN_EMAILS → ADMIN. Bootstrap: the very first user
// in an empty database becomes OWNER + ADMIN.
async function rolesForLogin(email?: string | null): Promise<Role[]> {
  if (email && adminEmails.includes(email.toLowerCase())) {
    return [Role.MEMBER, Role.ADMIN];
  }
  const count = await db.user.count();
  if (count === 0) return [Role.MEMBER, Role.ADMIN, Role.OWNER];
  return [Role.MEMBER];
}

// Ensure the user is a member of the default organization (the seed creates it),
// and that an active org is set. Called on login.
async function ensureMembership(userId: string, email?: string | null) {
  const org = await db.organization.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!org) return; // seed creates the default org at deploy
  const existing = await db.membership.findUnique({
    where: { userId_orgId: { userId, orgId: org.id } },
  });
  if (!existing) {
    const isAdmin = !!email && adminEmails.includes(email.toLowerCase());
    const first = (await db.membership.count()) === 0;
    await db.membership.create({
      data: {
        userId,
        orgId: org.id,
        roles:
          isAdmin || first
            ? [Role.MEMBER, Role.ADMIN, Role.OWNER]
            : [Role.MEMBER],
      },
    });
  }
  await db.user.updateMany({
    where: { id: userId, activeOrgId: null },
    data: { activeOrgId: org.id },
  });
}

const devLoginEnabled =
  process.env.ENABLE_DEV_LOGIN === "true" ||
  process.env.NODE_ENV === "development";

const providers: Provider[] = [];

// Vipps Login (OIDC) — enabled automatically when keys are present. Vipps is
// standard OpenID Connect; the issuer URL auto-discovers endpoints via
// /.well-known/openid-configuration.
if (process.env.VIPPS_CLIENT_ID && process.env.VIPPS_CLIENT_SECRET) {
  providers.push({
    id: "vipps",
    name: "Vipps",
    type: "oidc",
    issuer:
      process.env.VIPPS_ISSUER ??
      "https://api.vipps.no/access-management-1.0/access/",
    clientId: process.env.VIPPS_CLIENT_ID,
    clientSecret: process.env.VIPPS_CLIENT_SECRET,
    client: { token_endpoint_auth_method: "client_secret_post" },
    checks: ["pkce", "state"],
    authorization: { params: { scope: "openid name email phoneNumber" } },
    profile(profile) {
      return {
        id: profile.sub as string,
        name: (profile.name as string) ?? "Unknown",
        email: (profile.email as string) ?? null,
      };
    },
  });
}

// Dev/demo login: name + email, no password. For local development and CI.
// Disable in production once Vipps Login is configured (ENABLE_DEV_LOGIN=false).
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Name and email",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const name = String(credentials?.name ?? "").trim();
        if (!email || !name) return null;
        const existing = await db.user.findUnique({ where: { email } });
        const roles = existing
          ? adminEmails.includes(email) && !existing.roles.includes(Role.ADMIN)
            ? [...existing.roles, Role.ADMIN]
            : undefined
          : await rolesForLogin(email);
        const user = await db.user.upsert({
          where: { email },
          update: { name, ...(roles ? { roles } : {}) },
          create: { email, name, roles: roles ?? [Role.MEMBER] },
        });
        await ensureMembership(user.id, email);
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    jwt: async ({ token, user, account, profile }) => {
      if (account?.provider === "vipps" && profile?.sub) {
        const p = profile as {
          sub: string;
          name?: string;
          email?: string;
          phone_number?: string;
        };
        const existing = await db.user.findUnique({
          where: { vippsSub: p.sub },
        });
        const roles = existing
          ? p.email &&
            adminEmails.includes(p.email.toLowerCase()) &&
            !existing.roles.includes(Role.ADMIN)
            ? [...existing.roles, Role.ADMIN]
            : undefined
          : await rolesForLogin(p.email);
        const dbUser = await db.user.upsert({
          where: { vippsSub: p.sub },
          update: {
            name: p.name ?? undefined,
            phone: p.phone_number ?? undefined,
            ...(roles ? { roles } : {}),
          },
          create: {
            vippsSub: p.sub,
            name: p.name ?? "Unknown",
            email: p.email ?? undefined,
            phone: p.phone_number ?? undefined,
            roles: roles ?? [Role.MEMBER],
          },
        });
        await ensureMembership(dbUser.id, p.email);
        token.userId = dbUser.id;
        trackProductEvent(
          "auth.login_completed",
          { provider: "vipps", isNewUser: !existing },
          { actorIdHash: hashAnalyticsId("user", dbUser.id) },
        );
      } else if (user && "id" in user && user.id) {
        token.userId = user.id;
        trackProductEvent(
          "auth.login_completed",
          { provider: account?.provider ?? "unknown" },
          { actorIdHash: hashAnalyticsId("user", user.id) },
        );
      }
      return token;
    },
    session: ({ session, token }) => {
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
