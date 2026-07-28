import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { I18nProvider } from "@/components/I18nProvider";
import { Nav } from "@/components/Nav";
import { auth } from "@/server/auth";
import { resolveSite } from "@/lib/site";
import { resolveLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = resolveSite();
  return { title: site.name, description: site.tagline };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff5b24",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value);

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-stone-100 font-sans text-stone-900 antialiased">
        <TRPCReactProvider>
          <I18nProvider locale={locale}>
            <ProductAnalytics />
            <Nav userName={session?.user?.name} />
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
              {children}
            </main>
          </I18nProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
