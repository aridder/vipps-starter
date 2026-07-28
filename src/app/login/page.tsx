"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useI18n } from "@/components/I18nProvider";

type Providers = Awaited<ReturnType<typeof getProviders>>;

export default function LoginPage() {
  const { locale, t } = useI18n();
  const [providers, setProviders] = useState<Providers>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    void getProviders().then(setProviders);
  }, []);

  const hasVipps = !!providers?.vipps;
  const hasDev = !!providers?.dev;

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_-40px_rgba(28,25,23,0.45)] md:grid-cols-2">
      <div className="bg-stone-900 p-7 text-white sm:p-9">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#ff7a4d]">
          Vipps Login
        </div>
        <h1 className="mt-4 text-3xl font-black">
          {locale === "no" ? "Én innlogging. Riktig område." : "One sign-in. The right area."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          {locale === "no"
            ? "Vipps bekrefter hvem du er og deler bare opplysningene du samtykker til. Rollen din avgjør om du ser kundeområdet eller driftssentralen."
            : "Vipps confirms who you are and only shares information you consent to. Your role determines whether you see the customer area or operations."}
        </p>
        <div className="mt-6 space-y-3 text-sm">
          <div className="rounded-xl bg-white/10 p-3">
            <span className="font-black">{locale === "no" ? "Kunde: " : "Customer: "}</span>
            {locale === "no" ? "betaling, historikk og egne avtaler" : "payments, history and own agreements"}
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <span className="font-black">{locale === "no" ? "Administrator: " : "Administrator: "}</span>
            {locale === "no" ? "drift, refusjoner, reservasjoner og medlemmer" : "operations, refunds, reserves and members"}
          </div>
        </div>
      </div>

      <div className="space-y-6 p-7 sm:p-9">
      <h2 className="text-2xl font-black">{t("login.title")}</h2>
      <p className="-mt-4 text-sm text-stone-500">
        {locale === "no"
          ? "Du sendes til Vipps for å godkjenne innloggingen."
          : "You are sent to Vipps to approve the sign-in."}
      </p>
      {hasVipps && (
        <button
          data-analytics-event="auth.login_started"
          data-analytics-label="vipps"
          onClick={() => signIn("vipps", { callbackUrl: "/" })}
          className="w-full rounded-2xl bg-[#ff5b24] py-3.5 font-black text-white shadow-[0_12px_30px_-14px_rgba(255,91,36,0.8)] transition hover:-translate-y-0.5"
        >
          {t("login.continueVipps")}
        </button>
      )}

      {hasVipps && hasDev && (
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <div className="h-px flex-1 bg-stone-200" />
          {t("login.or")}
          <div className="h-px flex-1 bg-stone-200" />
        </div>
      )}

      {hasDev && (
        <form
          className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void signIn("dev", { name, email, callbackUrl: "/" });
          }}
        >
          <p className="text-sm text-stone-500">{t("login.devNote")}</p>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("login.name")}
            required
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:border-indigo-500"
          />
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.email")}
            required
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:border-indigo-500"
          />
          <button
            data-testid="dev-login-submit"
            type="submit"
            data-analytics-event="auth.login_started"
            data-analytics-label="dev"
            disabled={!name || !email}
            className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {t("login.signIn")}
          </button>
        </form>
      )}

      {!hasVipps && !hasDev && (
        <p className="text-center text-sm text-stone-500">
          {t("login.noProviders")}
        </p>
      )}
      </div>
    </div>
  );
}
