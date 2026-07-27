"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";
import { AgreementInterval } from "@prisma/client";

export function DonateWidget({ siteName }: { siteName: string }) {
  const { t } = useI18n();
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
  const per = interval === "YEAR" ? t("per.yr") : t("per.mo");

  return (
    <section id="donate" className="scroll-mt-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">{t("donate.title")}</h2>
        <p className="mt-1 text-sm text-stone-500">
          {t("donate.sub", { name: siteName })}
        </p>

        {!on ? (
          <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm text-stone-500">
            {t("donate.notConfigured")}
          </div>
        ) : (
          <>
            {recurringOn && (
              <div className="mt-4 flex gap-2 rounded-2xl bg-stone-100 p-1">
                <button
                  onClick={() => setMode("once")}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${mode === "once" ? "bg-white shadow-sm" : "text-stone-500"}`}
                >
                  {t("donate.once")}
                </button>
                <button
                  onClick={() => setMode("recurring")}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${mode === "recurring" ? "bg-white shadow-sm" : "text-stone-500"}`}
                >
                  {t("donate.recurring")}
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
                    {iv === "YEAR" ? t("interval.year") : t("interval.month")}
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
                {t("donate.signInRecurring")}
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
                  ? t("donate.opening")
                  : mode === "recurring" && recurringOn
                    ? t("donate.support", { amount, per })
                    : t("donate.donate", { amount })}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
