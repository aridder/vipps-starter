import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { I18nProvider } from "@/components/I18nProvider";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { auth } from "@/server/auth";
import { resolveSite } from "@/lib/site";
import { resolveLocale } from "@/lib/i18n";
import { resolveFeatures } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = resolveSite();
  // Shared in Slack, X and agent crawlers as often as it is visited directly,
  // so the card matters as much as the page.
  return {
    title: site.name,
    description: site.tagline,
    applicationName: site.name,
    keywords: [
      "Vipps",
      "Vipps MobilePay",
      "betaling",
      "betalingsløsning",
      "abonnement",
      "faste trekk",
      "super merchant",
      "partner",
      "ePayment",
      "recurring payments",
      "Vipps Login",
      "webhooks",
      "Next.js",
      "TypeScript",
    ],
    authors: [{ name: site.author.name, url: site.author.url }],
    openGraph: {
      type: "website",
      siteName: site.name,
      title: site.name,
      description: site.tagline,
    },
    twitter: { card: "summary_large_image", title: site.name, description: site.tagline },
  };
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
  const features = resolveFeatures();

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-stone-100 font-sans text-stone-900 antialiased">
        <TRPCReactProvider>
          <I18nProvider locale={locale}>
            <ProductAnalytics />
            <Nav
              userName={session?.user?.name}
              features={{
                payments: features.payments,
                paymentAdmin: features.paymentAdmin,
              }}
            />
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
              {children}
            </main>
            <Footer site={resolveSite()} locale={locale} />
          </I18nProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
