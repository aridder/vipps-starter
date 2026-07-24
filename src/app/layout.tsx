import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { Nav } from "@/components/Nav";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "App Starter";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Next.js + tRPC + Prisma + Vipps starter template.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4338ca",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-dvh bg-stone-100 font-sans text-stone-900 antialiased">
        <TRPCReactProvider>
          <Nav userName={session?.user?.name} />
          <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
