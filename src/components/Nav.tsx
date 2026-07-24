"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import { Logo } from "@/components/Logo";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "App Starter";

export function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const features = api.meta.features.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/", label: "Home", show: true },
    {
      href: "/billing",
      label: "Billing",
      show: features.data?.payments ?? false,
    },
    {
      href: "/billing/admin",
      label: "Admin",
      show: (features.data?.paymentAdmin ?? false) && !!me.data?.isAdmin,
    },
    { href: "/settings", label: "Settings", show: !!me.data?.isAdmin },
  ];

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-1">
          <Link href="/" className="mr-3 flex items-center gap-2 font-bold">
            <Logo size={24} />
            <span className="hidden sm:inline">{APP_NAME}</span>
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
        {userName ? (
          <Link href="/profile" className="text-sm text-stone-600">
            {userName}
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
