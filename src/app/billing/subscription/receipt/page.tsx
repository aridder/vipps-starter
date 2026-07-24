"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import {
  AGREEMENT_INTERVAL_SUFFIX,
  AGREEMENT_STATUS_LABELS,
} from "@/lib/labels";

export default function SubscriptionReceiptPage() {
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
  const waiting = !a || a.status === "PENDING";

  return (
    <div className="space-y-4 py-8 text-center">
      {waiting && !status.isError ? (
        <>
          <div className="text-5xl">⏳</div>
          <h1 className="text-xl font-bold">Awaiting approval…</h1>
          <p className="text-sm text-stone-500">
            Approve the subscription in the Vipps app.
          </p>
        </>
      ) : active ? (
        <>
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-bold">Subscription active!</h1>
          <p className="text-sm text-stone-600">
            {a.description} — {a.amountOre / 100} kr{" "}
            {AGREEMENT_INTERVAL_SUFFIX[a.interval]}.
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold">Subscription not created</h1>
          <p className="text-sm text-stone-600">
            {a ? AGREEMENT_STATUS_LABELS[a.status] : "Not found."}
          </p>
        </>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        {!active && !waiting && (
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
