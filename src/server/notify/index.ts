import type { NotificationType, PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import { isEnabled } from "@/lib/features";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { sendPush } from "./push";

// Extra delivery channels beyond the always-on in-app notification.
export type NotifyChannel = "email" | "sms" | "push";

export type NotifyInput = {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  channels?: NotifyChannel[];
};

/**
 * Notify users. Always creates an in-app Notification; additionally fans out to
 * email/SMS/push for the requested channels when the matching feature flag is
 * on and the provider is configured. Never throws — notifications must not break
 * the primary action.
 */
export async function notifyUsers(
  db: PrismaClient,
  userIds: string[],
  input: NotifyInput,
): Promise<void> {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return;

  try {
    await db.notification.createMany({
      data: ids.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      })),
    });
  } catch (e) {
    console.error("in-app notification failed:", e);
  }

  const channels = input.channels ?? [];
  if (channels.length === 0) return;

  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, phone: true },
  });

  await Promise.all(
    users.map(async (u) => {
      const jobs: Promise<unknown>[] = [];
      if (channels.includes("email") && isEnabled("email") && u.email) {
        jobs.push(
          sendEmail({
            to: u.email,
            subject: input.title,
            text: input.body ?? input.title,
          }),
        );
      }
      if (channels.includes("sms") && isEnabled("sms") && u.phone) {
        jobs.push(
          sendSms({
            to: u.phone,
            body: input.body ? `${input.title}: ${input.body}` : input.title,
          }),
        );
      }
      if (channels.includes("push") && isEnabled("push")) {
        const subs = await db.pushSubscription.findMany({
          where: { userId: u.id },
        });
        for (const s of subs) {
          jobs.push(
            sendPush(
              { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
              { title: input.title, body: input.body, url: input.link },
            ),
          );
        }
      }
      await Promise.allSettled(jobs);
    }),
  );
}

/** Notify all admins/owners of an organization. */
export async function notifyOrgAdmins(
  db: PrismaClient,
  orgId: string | null,
  input: NotifyInput,
): Promise<void> {
  if (!orgId) return;
  const admins = await db.membership.findMany({
    where: {
      orgId,
      OR: [{ roles: { has: Role.ADMIN } }, { roles: { has: Role.OWNER } }],
    },
    select: { userId: true },
  });
  await notifyUsers(
    db,
    admins.map((a) => a.userId),
    input,
  );
}
