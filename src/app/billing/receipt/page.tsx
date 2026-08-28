"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";

export default function ReceiptPage() {
  const { t, locale } = useI18n();
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get("ref"));
  }, []);

  const status = api.payment.status.useQuery(
    { reference: ref ?? "" },
    {
      enabled: !!ref,
      retry: false,
      refetchInterval: (query) => {
        const s = query.state.data?.status;
        return s === "CREATED" || s === "AUTHORIZED" ? 2000 : false;
      },
    },
  );

  const p = status.data;
  const done = p?.status === "PAID";
  const donation = p?.purpose === "DONATION";
  const waiting = !p || p.status === "CREATED" || p.status === "AUTHORIZED";

  return (
    <div className="space-y-4 py-8 text-center">
      {waiting && !status.isError ? (
        <>
          <div className="text-5xl">⏳</div>
          <h1 className="text-xl font-bold">{t("receipt.checking")}</h1>
          <p className="text-sm text-stone-500">{t("receipt.confirming")}</p>
        </>
      ) : done ? (
        <>
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold">
            {t(donation ? "receipt.donationThanks" : "receipt.thanks")}
          </h1>
          {donation && (
            <p className="mx-auto max-w-lg text-sm leading-6 text-stone-600">
              {t("receipt.donationConfirmed")}
            </p>
          )}
          <p className="text-sm text-stone-600">
            {t("receipt.paidLine", {
              desc: p.description,
              amount: p.amountOre / 100,
            })}
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold">{t("receipt.notCompleted")}</h1>
          <p className="text-sm text-stone-600">
            {p ? t(`status.${p.status.toLowerCase()}`) : t("receipt.notFound")}
          </p>
        </>
      )}

      {done && (
        // The moment someone has just seen the integration work end to end is
        // the one moment they are actually curious about the code. Sending
        // them to "try again" was wasting it.
        <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-stone-200 bg-white p-5 text-left">
          <h2 className="text-sm font-black">
            {locale === "no"
              ? "Det du nettopp opplevde er åpen kildekode"
              : "What you just experienced is open source"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {locale === "no"
              ? "Betalingen gikk gjennom ePayment, og statusen du så ble hentet autoritativt fra Vipps – ikke gjettet fra en redirect. Alt sammen er noen få hundre linjer du kan kopiere."
              : "The payment went through ePayment, and the status you saw was fetched authoritatively from Vipps — not guessed from a redirect. All of it is a few hundred lines you can copy."}
          </p>
          {/* This list used to sit on the landing page, before anyone had paid,
              as a fourth "these are real payments" block. It belongs here,
              where every line of it has just actually happened. */}
          <ul className="mt-4 grid gap-1.5 text-xs leading-5 text-stone-600 sm:grid-cols-2">
            {(locale === "no"
              ? [
                  "Ekte ePayment og godkjenning i Vipps",
                  "Automatisk trekk og Vipps-kvittering",
                  "Autoritativ status, ikke en redirect",
                  "Signert webhook som trigger",
                ]
              : [
                  "A real ePayment approved in Vipps",
                  "Automatic capture and a Vipps receipt",
                  "Authoritative status, not a redirect",
                  "A signed webhook as the trigger",
                ]
            ).map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold">
            <a
              href="https://github.com/aridder/vipps-starter/blob/main/src/server/vipps.ts"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-stone-700 underline-offset-4 hover:underline"
            >
              src/server/vipps.ts ↗
            </a>
            <a
              href="https://github.com/aridder/vipps-starter"
              target="_blank"
              rel="noreferrer"
              className="text-[#ff5b24] underline-offset-4 hover:underline"
            >
              {locale === "no"
                ? "Gi repoet en stjerne"
                : "Star the repository"}{" "}
              ★
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        {!done && !waiting && (
          <Link
            href="/billing"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white"
          >
            {t("receipt.tryAgain")}
          </Link>
        )}
        <Link href="/" className="text-sm font-medium text-indigo-600">
          {t("receipt.back")}
        </Link>
      </div>
    </div>
  );
}
