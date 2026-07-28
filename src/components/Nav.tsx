"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/I18nProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const site = api.meta.site.useQuery();
  const features = api.meta.features.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/", label: t("nav.home"), show: true },
    {
      href: "/billing",
      label: locale === "no" ? "Min side" : "My page",
      show: features.data?.payments ?? false,
    },
    {
      href: "/billing/admin",
      label: locale === "no" ? "Driftssentral" : "Operations",
      show: (features.data?.paymentAdmin ?? false) && !!me.data?.isAdmin,
    },
    { href: "/settings", label: t("nav.settings"), show: !!me.data?.isAdmin },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-2 font-black">
            <Logo size={26} />
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
                  className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition ${
                    active
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          {userName ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-bold text-stone-700 transition hover:border-stone-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate sm:inline">{userName}</span>
              {me.data?.isAdmin && (
                <span className="hidden rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-700 md:inline">
                  Admin
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[#ff5b24] px-4 py-2 text-sm font-black text-white shadow-[0_8px_24px_-10px_rgba(255,91,36,0.8)] transition hover:-translate-y-0.5"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
