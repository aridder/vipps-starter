"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";

export default function SubscriptionReceiptPage() {
  const { t } = useI18n();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  const status = api.subscription.status.useQuery(
    { id: id ?? "" },
    {
      enabled: !!id,
      retry: false,
      refetchInterval: (query) =>
        query.state.data?.status === "PENDING" ? 2000 : false,
    },
  );

  const a = status.data;
  const active = a?.status === "ACTIVE";
  const donation = a?.purpose === "DONATION";
  const waiting = !a || a.status === "PENDING";

  return (
    <div className="space-y-4 py-8 text-center">
      {waiting && !status.isError ? (
        <>
          <div className="text-5xl">⏳</div>
          <h1 className="text-xl font-bold">{t("subreceipt.awaiting")}</h1>
          <p className="text-sm text-stone-500">{t("subreceipt.approve")}</p>
        </>
      ) : active ? (
        <>
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-bold">
            {t(
              donation ? "subreceipt.donationThanks" : "subreceipt.active",
            )}
          </h1>
          {donation && (
            <p className="mx-auto max-w-lg text-sm leading-6 text-stone-600">
              {t("subreceipt.donationConfirmed")}
            </p>
          )}
          <p className="text-sm text-stone-600">
            {t("subreceipt.activeLine", {
              desc: a.description,
              amount: a.amountOre / 100,
              per: a.interval === "YEAR" ? t("per.yr") : t("per.mo"),
            })}
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold">{t("subreceipt.notCreated")}</h1>
          <p className="text-sm text-stone-600">
            {a ? t(`astatus.${a.status.toLowerCase()}`) : t("subreceipt.notFound")}
          </p>
        </>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        {!active && !waiting && (
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
