"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  AGREEMENT_INTERVAL_LABELS,
  AGREEMENT_INTERVAL_SUFFIX,
  AGREEMENT_STATUS_COLORS,
  AGREEMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatDate,
} from "@/lib/labels";
import { AgreementInterval, PaymentPurpose } from "@prisma/client";

const ONE_OFF_PRESETS: Record<"ONE_TIME" | "DONATION", number[]> = {
  ONE_TIME: [50, 100, 200],
  DONATION: [50, 100, 250],
};

const RECURRING_PRESETS: Record<
  "SUBSCRIPTION" | "DONATION",
  Record<AgreementInterval, number[]>
> = {
  SUBSCRIPTION: { MONTH: [50, 100, 150], YEAR: [300, 500, 800] },
  DONATION: { MONTH: [50, 100, 200], YEAR: [200, 500, 1000] },
};

export default function BillingPage() {
  const features = api.meta.features.useQuery();
  const available = api.payment.available.useQuery();
  const [mode, setMode] = useState<"once" | "recurring">("once");

  const on = available.data?.available ?? false;
  const recurringOn = features.data?.recurring ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-stone-500">Pay with Vipps.</p>
      </div>

      {!on ? (
        <div className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-500">
          💳 Vipps payments activate once the organization has entered its
          payment API keys and connected its MSN.
        </div>
      ) : (
        <>
          {recurringOn && (
            <div className="flex gap-2 rounded-2xl bg-stone-100 p-1">
              <button
                onClick={() => setMode("once")}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
                  mode === "once" ? "bg-white shadow-sm" : "text-stone-500"
                }`}
              >
                One-time
              </button>
              <button
                onClick={() => setMode("recurring")}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
                  mode === "recurring" ? "bg-white shadow-sm" : "text-stone-500"
                }`}
              >
                Subscription
              </button>
            </div>
          )}

          {mode === "once" || !recurringOn ? <OnceForm /> : <RecurringForm />}
        </>
      )}

      <MySubscriptions />
      <MyHistory />
    </div>
  );
}

function OnceForm() {
  const [purpose, setPurpose] = useState<"ONE_TIME" | "DONATION">("ONE_TIME");
  const [amount, setAmount] = useState("100");

  const create = api.payment.create.useMutation({
    onSuccess: (res) => {
      window.location.href = res.redirectUrl;
    },
  });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {(["ONE_TIME", "DONATION"] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPurpose(p);
              setAmount(String(ONE_OFF_PRESETS[p][0]));
            }}
            className={`rounded-2xl p-4 text-left shadow-sm ${
              purpose === p ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            <div className="text-sm font-semibold">
              {p === "ONE_TIME" ? "Payment" : "Donation"}
            </div>
          </button>
        ))}
      </div>

      <AmountPicker
        presets={ONE_OFF_PRESETS[purpose]}
        amount={amount}
        setAmount={setAmount}
      />

      {create.error && (
        <p className="text-sm text-red-600">{create.error.message}</p>
      )}
      <button
        disabled={create.isPending || Number(amount) < 1}
        onClick={() =>
          create.mutate({ purpose: PaymentPurpose[purpose], amountKr: Number(amount) })
        }
        className="w-full rounded-xl bg-[#ff5b24] py-3 font-semibold text-white disabled:opacity-50"
      >
        {create.isPending ? "Opening Vipps…" : `Pay ${amount} kr with Vipps`}
      </button>
    </>
  );
}

function RecurringForm() {
  const [purpose, setPurpose] = useState<"SUBSCRIPTION" | "DONATION">(
    "SUBSCRIPTION",
  );
  const [interval, setInterval] = useState<AgreementInterval>("MONTH");
  const [amount, setAmount] = useState("100");

  const create = api.subscription.create.useMutation({
    onSuccess: (res) => {
      window.location.href = res.confirmationUrl;
    },
  });

  const presets = RECURRING_PRESETS[purpose][interval];

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {(["SUBSCRIPTION", "DONATION"] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPurpose(p);
              setAmount(String(RECURRING_PRESETS[p][interval][0]));
            }}
            className={`rounded-2xl p-4 text-left shadow-sm ${
              purpose === p ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            <div className="text-sm font-semibold">
              {p === "SUBSCRIPTION" ? "Subscription" : "Recurring gift"}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-stone-600">
          How often?
        </label>
        <div className="mb-4 flex gap-2">
          {(["MONTH", "YEAR"] as AgreementInterval[]).map((iv) => (
            <button
              key={iv}
              onClick={() => {
                setInterval(iv);
                setAmount(String(RECURRING_PRESETS[purpose][iv][0]));
              }}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
                interval === iv
                  ? "bg-indigo-600 text-white"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {AGREEMENT_INTERVAL_LABELS[iv]}
            </button>
          ))}
        </div>
        <AmountPickerInner
          presets={presets}
          amount={amount}
          setAmount={setAmount}
          label="Amount per charge (kr)"
        />
      </div>

      {create.error && (
        <p className="text-sm text-red-600">{create.error.message}</p>
      )}
      <button
        disabled={create.isPending || Number(amount) < 1}
        onClick={() =>
          create.mutate({
            purpose: PaymentPurpose[purpose],
            amountKr: Number(amount),
            interval,
          })
        }
        className="w-full rounded-xl bg-[#ff5b24] py-3 font-semibold text-white disabled:opacity-50"
      >
        {create.isPending
          ? "Opening Vipps…"
          : `Start subscription · ${amount} kr ${AGREEMENT_INTERVAL_SUFFIX[interval]}`}
      </button>
    </>
  );
}

function AmountPicker(props: {
  presets: number[];
  amount: string;
  setAmount: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <AmountPickerInner {...props} label="Amount (kr)" />
    </div>
  );
}

function AmountPickerInner({
  presets,
  amount,
  setAmount,
  label,
}: {
  presets: number[];
  amount: string;
  setAmount: (v: string) => void;
  label: string;
}) {
  return (
    <>
      <label className="mb-2 block text-sm font-medium text-stone-600">
        {label}
      </label>
      <div className="mb-3 flex gap-2">
        {presets.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
              amount === String(v)
                ? "bg-indigo-600 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
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
        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:border-indigo-500"
      />
    </>
  );
}

function MySubscriptions() {
  const mine = api.subscription.mine.useQuery(undefined, { retry: false });
  const utils = api.useUtils();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const stop = api.subscription.stop.useMutation({
    onSettled: () => {
      setCancelling(null);
      void utils.subscription.mine.invalidate();
    },
  });

  const subs = mine.data?.filter((a) => a.status !== "STOPPED") ?? [];
  if (mine.isError || subs.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-stone-600">My subscriptions</h2>
      {subs.map((a) => {
        const isCancelling = cancelling === a.id && stop.isPending;
        return (
          <div key={a.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">
                  {a.amountOre / 100} kr {AGREEMENT_INTERVAL_SUFFIX[a.interval]}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {a.description}
                  {a.nextChargeDate
                    ? ` · next ${formatDate(a.nextChargeDate)}`
                    : ""}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${AGREEMENT_STATUS_COLORS[a.status]}`}
              >
                {AGREEMENT_STATUS_LABELS[a.status]}
              </span>
            </div>
            {a.status === "ACTIVE" && (
              <button
                disabled={isCancelling}
                onClick={() => {
                  if (confirm("Cancel this subscription? You won't be charged again.")) {
                    setCancelling(a.id);
                    stop.mutate({ id: a.id });
                  }
                }}
                className="mt-3 w-full rounded-xl border border-stone-200 py-2 text-sm font-semibold text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                {isCancelling ? "Cancelling…" : "Cancel subscription"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MyHistory() {
  const mine = api.payment.mine.useQuery(undefined, { retry: false });
  const rows = mine.data ?? [];
  if (mine.isError || rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-stone-600">Payment history</h2>
      {rows.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {p.amountOre / 100} kr
            </div>
            <div className="truncate text-xs text-stone-400">
              {p.description} · {formatDate(p.createdAt)}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_COLORS[p.status]}`}
          >
            {PAYMENT_STATUS_LABELS[p.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
