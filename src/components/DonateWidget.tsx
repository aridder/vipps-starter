"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AgreementInterval } from "@prisma/client";
import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";

export function DonateWidget({
  siteName,
  recipientName,
}: {
  siteName: string;
  recipientName: string;
}) {
  const { locale, t } = useI18n();
  const available = api.payment.available.useQuery();
  const features = api.meta.features.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });
  const [mode, setMode] = useState<"once" | "recurring">("once");
  const [amount, setAmount] = useState("100");
  const [interval, setInterval] = useState<AgreementInterval>("MONTH");
  const [acknowledged, setAcknowledged] = useState(false);

  const once = api.payment.create.useMutation({
    onSuccess: (result) => (window.location.href = result.redirectUrl),
  });
  const recurring = api.subscription.create.useMutation({
    onSuccess: (result) => (window.location.href = result.confirmationUrl),
  });

  const on = available.data?.available ?? false;
  const recurringOn = features.data?.recurring ?? false;
  const loggedIn = !!me.data?.id;
  const presets = [50, 100, 250, 500];
  const per = interval === "YEAR" ? t("per.yr") : t("per.mo");
  const isLoading = available.isLoading || features.isLoading;
  const amountKr = Number(amount);
  const validAmount =
    Number.isInteger(amountKr) && amountKr >= 1 && amountKr <= 100000;

  return (
    <section id="donate" className="scroll-mt-24">
      <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_60px_-36px_rgba(28,25,23,0.45)]">
        <div className="border-b border-stone-100 p-6 sm:p-8">
          <div className="mb-3 inline-flex rounded-full bg-[#ff5b24]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#d93f0b]">
            {on
              ? locale === "no"
                ? "Ekte produksjonsbetaling"
                : "Real production payment"
              : locale === "no"
                ? "Klar for produksjonsbetaling"
                : "Ready for production payments"}
          </div>
          <h2 className="text-2xl font-black">{t("donate.title")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
            {t("donate.sub", { name: siteName })}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {isLoading ? (
            <div
              className="space-y-3"
              aria-label={locale === "no" ? "Laster Vipps" : "Loading Vipps"}
            >
              <div className="h-16 animate-pulse rounded-2xl bg-stone-100" />
              <div className="h-10 animate-pulse rounded-2xl bg-stone-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-stone-100" />
            </div>
          ) : available.isError ? (
            // Distinct from "not enabled": we do not know the state, and
            // saying "not active yet" would present a guess as a fact.
            <div
              role="alert"
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700"
            >
              <div className="font-bold">
                {locale === "no"
                  ? "Fikk ikke kontakt med betalingstjenesten"
                  : "Could not reach the payment service"}
              </div>
              <p className="mt-1">
                {locale === "no"
                  ? "Vi vet ikke om betaling er tilgjengelig akkurat nå. Prøv å laste siden på nytt."
                  : "We do not know whether payments are available right now. Try reloading the page."}
              </p>
              <button
                type="button"
                onClick={() => void available.refetch()}
                className="mt-3 rounded-xl border border-stone-300 px-3.5 py-1.5 text-xs font-bold transition hover:border-stone-500"
              >
                {locale === "no" ? "Prøv igjen" : "Try again"}
              </button>
            </div>
          ) : !on ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="font-bold">
                {locale === "no"
                  ? "Ekte betaling er ikke aktivert ennå"
                  : "Real payments are not active yet"}
              </div>
              <p className="mt-1 text-amber-800">
                {locale === "no"
                  ? "Ingen penger kan trekkes akkurat nå. Donasjonsknappen aktiveres så snart det separate Vipps-nøkkelsettet har ePayment-tilgang."
                  : "No money can be charged right now. The donation button activates as soon as the dedicated Vipps key set has ePayment access."}
              </p>
              {available.data?.reason && (
                <p className="mt-2 text-xs text-amber-700">
                  {available.data.reason}
                </p>
              )}
            </div>
          ) : (
            <>
              {recurringOn && (
                <div className="grid gap-2 rounded-2xl bg-stone-100 p-1 sm:grid-cols-2">
                  <ModeButton
                    active={mode === "once"}
                    title={t("donate.once")}
                    body={
                      locale === "no"
                        ? "Betal én gang – ingen innlogging kreves"
                        : "Pay once – no sign-in required"
                    }
                    onClick={() => {
                      setMode("once");
                      setAcknowledged(false);
                    }}
                  />
                  <ModeButton
                    active={mode === "recurring"}
                    title={t("donate.recurring")}
                    body={
                      locale === "no"
                        ? "En avtale du kan stoppe når som helst"
                        : "An agreement you can stop at any time"
                    }
                    onClick={() => {
                      setMode("recurring");
                      setAcknowledged(false);
                    }}
                  />
                </div>
              )}

              {mode === "recurring" && recurringOn && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">
                    {locale === "no" ? "Hvor ofte?" : "How often?"}
                  </div>
                  <div className="flex gap-2">
                    {(["MONTH", "YEAR"] as AgreementInterval[]).map((value) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={interval === value}
                        onClick={() => {
                          setInterval(value);
                          setAcknowledged(false);
                        }}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                          interval === value
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {value === "YEAR"
                          ? t("interval.year")
                          : t("interval.month")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <label
                  htmlFor="donation-amount"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-400"
                >
                  {locale === "no" ? "Velg beløp" : "Choose amount"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={amount === String(value)}
                      onClick={() => {
                        setAmount(String(value));
                      }}
                      className={`rounded-xl py-2.5 text-sm font-bold transition ${
                        amount === String(value)
                          ? "bg-[#ff5b24] text-white shadow-sm"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {value} kr
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mt-3">
                <input
                  id="donation-amount"
                  aria-label={
                    locale === "no"
                      ? "Eget beløp i kroner"
                      : "Custom amount in kroner"
                  }
                  type="number"
                  min={1}
                  max={100000}
                  step={1}
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                  }}
                  className="w-full rounded-xl border border-stone-200 px-3 py-3 pr-12 font-semibold outline-none transition focus:border-[#ff5b24] focus:ring-4 focus:ring-[#ff5b24]/10"
                />
                <span className="pointer-events-none absolute right-4 top-3 text-sm font-bold text-stone-400">
                  kr
                </span>
              </div>

              {(once.error || recurring.error) && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {once.error?.message ?? recurring.error?.message}
                </p>
              )}

              <div className="mt-4 rounded-2xl border border-[#ff5b24]/25 bg-[#fff4ef] p-4 text-sm text-stone-800">
                <div className="font-black text-[#c93808]">
                  {locale === "no"
                    ? "Dette er en ekte donasjon"
                    : "This is a real donation"}
                </div>
                <p className="mt-1 leading-6">
                  {locale === "no"
                    ? `${amount || "0"} kr${mode === "recurring" && recurringOn ? ` ${per}` : ""} trekkes i Vipps og går til ${recipientName}. Du kjøper ingen vare eller tjeneste.`
                    : `${amount || "0"} kr${mode === "recurring" && recurringOn ? ` ${per}` : ""} is charged in Vipps and goes to ${recipientName}. You are not purchasing goods or services.`}
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-[#ff5b24]"
                  />
                  <span>
                    {locale === "no"
                      ? "Jeg forstår at dette er ekte penger og ønsker å donere."
                      : "I understand this is real money and want to donate."}
                  </span>
                </label>
              </div>

              {mode === "recurring" && recurringOn && !loggedIn ? (
                <button
                  type="button"
                  disabled={!acknowledged}
                  onClick={() => signIn("vipps", { callbackUrl: "/" })}
                  className="mt-4 w-full rounded-2xl bg-[#ff5b24] py-3.5 font-black text-white shadow-[0_12px_30px_-14px_rgba(255,91,36,0.8)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                >
                  {t("donate.signInRecurring")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    !acknowledged ||
                    once.isPending ||
                    recurring.isPending ||
                    !validAmount
                  }
                  onClick={() =>
                    mode === "recurring" && recurringOn
                      ? recurring.mutate({
                          purpose: "DONATION",
                          amountKr,
                          interval,
                        })
                      : once.mutate({
                          purpose: "DONATION",
                          amountKr,
                          description: `Støtte til ${siteName}`,
                        })
                  }
                  className="mt-4 w-full rounded-2xl bg-[#ff5b24] py-3.5 font-black text-white shadow-[0_12px_30px_-14px_rgba(255,91,36,0.8)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                >
                  {once.isPending || recurring.isPending
                    ? t("donate.opening")
                    : mode === "recurring" && recurringOn
                      ? t("donate.support", { amount, per })
                      : t("donate.donate", { amount })}
                </button>
              )}

              <div className="mt-5 grid gap-2 border-t border-stone-100 pt-5 text-xs text-stone-500 sm:grid-cols-3">
                <Step number="1" text={locale === "no" ? "Du velger beløp" : "You choose an amount"} />
                <Step number="2" text={locale === "no" ? "Vipps åpnes trygt" : "Vipps opens securely"} />
                <Step number="3" text={locale === "no" ? "Status bekreftes her" : "Status is confirmed here"} />
              </div>
              <div className="mt-4 rounded-2xl bg-stone-950 p-4 text-sm text-stone-200">
                <div className="font-black text-white">
                  {locale === "no"
                    ? "Dette beviser betalingen i praksis"
                    : "What this payment proves in practice"}
                </div>
                <ul className="mt-2 grid gap-1.5 text-xs leading-5 sm:grid-cols-2">
                  {(mode === "recurring" && recurringOn
                    ? locale === "no"
                      ? [
                          "Vipps Login og kundesamtykke",
                          "Ekte Recurring-avtale og første trekk",
                          "Autoritativ status og signert webhook",
                          "Avtalen kan sees og stoppes på Min side",
                        ]
                      : [
                          "Vipps Login and customer consent",
                          "Real Recurring agreement and first charge",
                          "Authoritative status and signed webhook",
                          "The agreement can be viewed and stopped on My page",
                        ]
                    : locale === "no"
                      ? [
                          "Ekte ePayment og godkjenning i Vipps",
                          "Automatisk trekk og Vipps-kvittering",
                          "Autoritativ status og signert webhook",
                          "Betaling og oppgjør i Driftssentral",
                        ]
                      : [
                          "Real ePayment and Vipps approval",
                          "Automatic capture and Vipps receipt",
                          "Authoritative status and signed webhook",
                          "Payment and settlement in Operations",
                        ]
                  ).map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-stone-400">
                {locale === "no"
                  ? "Vipps Starter lagrer aldri kortinformasjon. Faste avtaler krever innlogging slik at du kan se og stoppe dem senere."
                  : "Vipps Starter never stores card information. Recurring agreements require sign-in so you can view and stop them later."}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ModeButton({
  active,
  title,
  body,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-left text-sm transition ${
        active
          ? "bg-white text-stone-900 shadow-sm"
          : "text-stone-500 hover:text-stone-900"
      }`}
    >
      <span className="block font-black">{title}</span>
      <span className="mt-0.5 block text-xs font-medium opacity-70">{body}</span>
    </button>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div>
      <span className="font-black text-stone-800">{number}.</span> {text}
    </div>
  );
}
