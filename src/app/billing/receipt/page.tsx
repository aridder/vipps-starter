"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { PAYMENT_STATUS_LABELS } from "@/lib/labels";

export default function ReceiptPage() {
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
          <h1 className="text-xl font-bold">Checking payment…</h1>
          <p className="text-sm text-stone-500">Confirming with Vipps.</p>
        </>
      ) : done ? (
        <>
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold">Thanks!</h1>
          <p className="text-sm text-stone-600">
            {p.description} — {p.amountOre / 100} kr.
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold">Payment not completed</h1>
          <p className="text-sm text-stone-600">
            {p ? PAYMENT_STATUS_LABELS[p.status] : "Payment not found."}
          </p>
        </>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        {!done && !waiting && (
          <Link
            href="/billing"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </Link>
        )}
        <Link href="/" className="text-sm font-medium text-indigo-600">
          Back to app →
        </Link>
      </div>
    </div>
  );
}
