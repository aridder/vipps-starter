import { PrismaClient, Role } from "@prisma/client";

const db = new PrismaClient();

/**
 * Idempotent seed — safe to run repeatedly.
 * Ensures a default organization exists so payments/subscriptions always have
 * a tenant to attach to (also used as the single tenant when multiTenant is off).
 */
async function main() {
  const org = await db.organization.upsert({
    where: { slug: "default" },
    update: {},
    create: { slug: "default", name: "Default organization" },
  });

  // Make sure every existing user is a member of the default org
  const users = await db.user.findMany({ select: { id: true } });
  for (const u of users) {
    await db.membership.upsert({
      where: { userId_orgId: { userId: u.id, orgId: org.id } },
      update: {},
      create: { userId: u.id, orgId: org.id, roles: [Role.MEMBER] },
    });
  }

  console.log(`Seed OK — org "${org.slug}", ${users.length} member(s) ensured.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
