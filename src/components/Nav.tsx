"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/I18nProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const site = api.meta.site.useQuery();
  const features = api.meta.features.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/", label: t("nav.home"), show: true },
    {
      href: "/billing",
      label: t("nav.billing"),
      show: features.data?.payments ?? false,
    },
    {
      href: "/billing/admin",
      label: t("nav.admin"),
      show: (features.data?.paymentAdmin ?? false) && !!me.data?.isAdmin,
    },
    { href: "/settings", label: t("nav.settings"), show: !!me.data?.isAdmin },
  ];

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-1">
          <Link href="/" className="mr-3 flex items-center gap-2 font-bold">
            <Logo size={24} />
            <span className="hidden sm:inline">
              {site.data?.name ?? "Vipps Starter"}
            </span>
          </Link>
          {links
            .filter((l) => l.show)
            .map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {userName ? (
            <Link href="/profile" className="text-sm text-stone-600">
              {userName}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
