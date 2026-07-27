"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useI18n } from "@/components/I18nProvider";

type Providers = Awaited<ReturnType<typeof getProviders>>;

export default function LoginPage() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<Providers>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    void getProviders().then(setProviders);
  }, []);

  const hasVipps = !!providers?.vipps;
  const hasDev = !!providers?.dev;

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <h1 className="text-center text-2xl font-bold">{t("login.title")}</h1>

      {hasVipps && (
        <button
          onClick={() => signIn("vipps", { callbackUrl: "/" })}
          className="w-full rounded-xl bg-[#ff5b24] py-3 font-semibold text-white"
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
  );
}
