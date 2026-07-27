"use client";

import { signOut } from "next-auth/react";
import { api } from "@/trpc/react";
import { formatDate } from "@/lib/labels";
import { useI18n } from "@/components/I18nProvider";

export default function ProfilePage() {
  const { t } = useI18n();
  const me = api.meta.me.useQuery(undefined, { retry: false });
  const utils = api.useUtils();
  const notifications = api.notification.list.useQuery(undefined, {
    retry: false,
  });
  const markAllRead = api.notification.markAllRead.useMutation({
    onSuccess: () => void utils.notification.list.invalidate(),
  });

  if (me.isError || !me.data?.id) {
    return <p className="text-sm text-stone-500">{t("profile.signInToView")}</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t("profile.title")}</h1>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="font-semibold">{me.data.name}</div>
        {me.data.email && (
          <div className="text-sm text-stone-500">{me.data.email}</div>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {me.data.roles.map((r) => (
            <span
              key={r}
              className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-600">
            {t("profile.notifications")}
          </h2>
          <button
            onClick={() => markAllRead.mutate()}
            className="text-xs text-indigo-600"
          >
            {t("profile.markAllRead")}
          </button>
        </div>
        {notifications.data?.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl p-3 shadow-sm ${n.read ? "bg-white" : "bg-indigo-50"}`}
          >
            <div className="text-sm font-medium">{n.title}</div>
            {n.body && (
              <div className="text-xs text-stone-500">{n.body}</div>
            )}
            <div className="mt-1 text-[10px] text-stone-400">
              {formatDate(n.createdAt)}
            </div>
          </div>
        ))}
        {notifications.isSuccess && notifications.data.length === 0 && (
          <div className="rounded-2xl bg-white p-4 text-sm text-stone-500 shadow-sm">
            {t("profile.none")}
          </div>
        )}
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600"
      >
        {t("profile.signOut")}
      </button>
    </div>
  );
}
