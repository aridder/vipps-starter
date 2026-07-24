"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { api } from "@/trpc/react";
import { site } from "@/lib/site";
import { AGREEMENT_INTERVAL_LABELS } from "@/lib/labels";
import { AgreementInterval } from "@prisma/client";

const FEATURES = [
  {
    title: "One-off payments",
    body: "Vipps ePayment with authoritative status sync — never trust a webhook body.",
  },
  {
    title: "Subscriptions",
    body: "Recurring agreements + a daily cron that renews charges before they're due.",
  },
  {
    title: "Webhooks + signatures",
    body: "HMAC-validated webhooks (warn or enforce) that can't fake a payment.",
  },
  {
    title: "Partner / super-merchant",
    body: "Bill each tenant to its own MSN; self-serve webhook onboarding per org.",
  },
  {
    title: "Refunds & reserves",
    body: "Optional admin console: capture, partial refund, cancel — off by default.",
  },
  {
    title: "Batteries included",
    body: "Auth (Vipps Login + dev), Prisma/Postgres, feature flags, e2e with screenshots.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-12">
      <Hero />
      <Features />
      <Donate />
      <About />
      <LicenseNote />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="pt-6 text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ff5b24]/10 px-3 py-1 text-xs font-semibold text-[#ff5b24]">
        Vipps · Next.js · tRPC · Prisma
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {site.name}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-stone-500">{site.tagline}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href="#donate"
          className="rounded-xl bg-[#ff5b24] px-5 py-2.5 font-semibold text-white"
        >
          Support with Vipps
        </a>
        <a
          href={site.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 hover:bg-stone-50"
        >
          Get it on GitHub →
        </a>
      </div>
      <p className="mt-3 text-xs text-stone-400">
        The donation below is a <strong>real Vipps payment</strong> to the
        maintainer — so you can see the integration work end-to-end.
      </p>
    </section>
  );
}

function Features() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {FEATURES.map((f) => (
        <div key={f.title} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="font-semibold">{f.title}</div>
          <div className="mt-1 text-sm text-stone-500">{f.body}</div>
        </div>
      ))}
    </section>
  );
}

function Donate() {
  const available = api.payment.available.useQuery();
  const features = api.meta.features.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });
  const [mode, setMode] = useState<"once" | "recurring">("once");
  const [amount, setAmount] = useState("100");
  const [interval, setInterval] = useState<AgreementInterval>("MONTH");

  const once = api.payment.create.useMutation({
    onSuccess: (r) => (window.location.href = r.redirectUrl),
  });
  const recurring = api.subscription.create.useMutation({
    onSuccess: (r) => (window.location.href = r.confirmationUrl),
  });

  const on = available.data?.available ?? false;
  const recurringOn = features.data?.recurring ?? false;
  const loggedIn = !!me.data?.id;
  const presets = [50, 100, 250, 500];

  return (
    <section id="donate" className="scroll-mt-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Support the project 💜</h2>
        <p className="mt-1 text-sm text-stone-500">
          If {site.name} saves you time, chip in what you can. Every krone helps
          keep it maintained.
        </p>

        {!on ? (
          <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm text-stone-500">
            Vipps isn’t configured on this instance yet. Once the host adds its
            Vipps keys + MSN, this button takes real donations.
          </div>
        ) : (
          <>
            {recurringOn && (
              <div className="mt-4 flex gap-2 rounded-2xl bg-stone-100 p-1">
                <button
                  onClick={() => setMode("once")}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${mode === "once" ? "bg-white shadow-sm" : "text-stone-500"}`}
                >
                  One-off
                </button>
                <button
                  onClick={() => setMode("recurring")}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${mode === "recurring" ? "bg-white shadow-sm" : "text-stone-500"}`}
                >
                  Monthly / yearly
                </button>
              </div>
            )}

            {mode === "recurring" && recurringOn && (
              <div className="mt-3 flex gap-2">
                {(["MONTH", "YEAR"] as AgreementInterval[]).map((iv) => (
                  <button
                    key={iv}
                    onClick={() => setInterval(iv)}
                    className={`flex-1 rounded-xl py-2 text-sm font-semibold ${interval === iv ? "bg-indigo-600 text-white" : "bg-stone-100 text-stone-700"}`}
                  >
                    {AGREEMENT_INTERVAL_LABELS[iv]}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {presets.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${amount === String(v) ? "bg-[#ff5b24] text-white" : "bg-stone-100 text-stone-700"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-3 w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:border-[#ff5b24]"
            />

            {(once.error || recurring.error) && (
              <p className="mt-2 text-sm text-red-600">
                {once.error?.message ?? recurring.error?.message}
              </p>
            )}

            {mode === "recurring" && recurringOn && !loggedIn ? (
              <button
                onClick={() => signIn("vipps", { callbackUrl: "/" })}
                className="mt-4 w-full rounded-xl bg-[#ff5b24] py-3 font-semibold text-white"
              >
                Sign in with Vipps to set up recurring
              </button>
            ) : (
              <button
                disabled={
                  once.isPending || recurring.isPending || Number(amount) < 1
                }
                onClick={() =>
                  mode === "recurring" && recurringOn
                    ? recurring.mutate({
                        purpose: "DONATION",
                        amountKr: Number(amount),
                        interval,
                      })
                    : once.mutate({ purpose: "DONATION", amountKr: Number(amount) })
                }
                className="mt-4 w-full rounded-xl bg-[#ff5b24] py-3 font-semibold text-white disabled:opacity-50"
              >
                {once.isPending || recurring.isPending
                  ? "Opening Vipps…"
                  : mode === "recurring" && recurringOn
                    ? `Support ${amount} kr / ${interval === "YEAR" ? "yr" : "mo"} with Vipps`
                    : `Donate ${amount} kr with Vipps`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function About() {
  const a = site.author;
  return (
    <section className="rounded-3xl bg-stone-900 p-6 text-stone-100">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
        Built by
      </div>
      <h2 className="mt-1 text-xl font-bold">{a.name}</h2>
      <p className="mt-1 text-sm text-stone-300">{a.tagline}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-900"
        >
          See my services →
        </a>
        <a
          href={`mailto:${a.email}`}
          className="rounded-xl border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
        >
          Hire me
        </a>
      </div>
    </section>
  );
}

function LicenseNote() {
  return (
    <section className="rounded-2xl bg-white p-5 text-sm shadow-sm">
      <h2 className="font-semibold">License & fair use</h2>
      <p className="mt-1 text-stone-500">
        {site.name} is source-available under the{" "}
        <a
          href="https://polyformproject.org/licenses/small-business/1.0.0"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600"
        >
          PolyForm Small Business License
        </a>
        : free to use if your company has fewer than 100 people and under $1M
        revenue. Larger companies need a commercial license —{" "}
        <a href={`mailto:${site.author.email}`} className="text-indigo-600">
          get in touch
        </a>
        . Either way, donations keep it alive. 🙏
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
      © {site.author.name} ·{" "}
      <a href={site.githubUrl} target="_blank" rel="noreferrer" className="underline">
        GitHub
      </a>{" "}
      ·{" "}
      <a href={site.author.url} target="_blank" rel="noreferrer" className="underline">
        {site.author.url.replace(/^https?:\/\//, "")}
      </a>
    </footer>
  );
}
