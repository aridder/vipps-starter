"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";

export default function ReceiptPage() {
  const { t } = useI18n();
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
          <h1 className="text-xl font-bold">{t("receipt.thanks")}</h1>
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
