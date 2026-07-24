"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  AGREEMENT_INTERVAL_SUFFIX,
  AGREEMENT_STATUS_COLORS,
  AGREEMENT_STATUS_LABELS,
  PAYMENT_PURPOSE_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatDate,
} from "@/lib/labels";

function kr(ore: number) {
  return `${(ore / 100).toLocaleString("en-GB")} kr`;
}

type Tab = "overview" | "payments" | "subscriptions";

export default function BillingAdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const features = api.meta.features.useQuery();

  // Gated by the `paymentAdmin` flag (off by default). When disabled the whole
  // console is hidden and its endpoints reject — nothing here is in use.
  if (features.isSuccess && !features.data.paymentAdmin) {
    return (
      <div className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-500">
        The billing admin console is disabled. Enable it with{" "}
        <code>FEATURE_PAYMENT_ADMIN=true</code> to manage refunds, reserves and
        subscriptions.
      </div>
    );
  }
  if (!features.data?.paymentAdmin) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage payments, refunds, reserves and subscriptions.
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl bg-stone-100 p-1">
        {(["overview", "payments", "subscriptions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-white shadow-sm" : "text-stone-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "payments" && <Payments />}
      {tab === "subscriptions" && <Subscriptions />}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className={`text-2xl font-bold ${accent ?? "text-stone-900"}`}>
        {value}
      </div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

function Overview() {
  const p = api.payment.all.useQuery();
  const s = api.subscription.all.useQuery(undefined, { retry: false });
  const d = p.data;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Kpi
          label="Net revenue"
          value={d ? kr(Math.round((d.netKr ?? 0) * 100)) : "–"}
          accent="text-emerald-700"
        />
        <Kpi label="Captured" value={d ? kr(Math.round(d.capturedKr * 100)) : "–"} />
        <Kpi
          label="Refunded"
          value={d ? kr(Math.round(d.refundedKr * 100)) : "–"}
          accent="text-violet-700"
        />
        <Kpi label="Reserved" value={d ? String(d.reservedCount) : "–"} accent="text-sky-700" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Payments paid" value={d ? String(d.paidCount) : "–"} />
        <Kpi
          label="Active subscriptions"
          value={s.data ? String(s.data.activeCount) : "–"}
          accent="text-emerald-700"
        />
      </div>
    </div>
  );
}

function Payments() {
  const utils = api.useUtils();
  const q = api.payment.all.useQuery();
  const [open, setOpen] = useState<string | null>(null);

  const refresh = () => void utils.payment.all.invalidate();
  const capture = api.payment.capture.useMutation({ onSuccess: refresh });
  const refund = api.payment.refund.useMutation({ onSuccess: refresh });
  const cancel = api.payment.cancel.useMutation({ onSuccess: refresh });
  const busy = capture.isPending || refund.isPending || cancel.isPending;

  return (
    <div className="space-y-2">
      {q.data?.payments.map((p) => {
        const isOpen = open === p.id;
        const refundable = p.capturedOre - p.refundedOre;
        return (
          <div key={p.id} className="rounded-2xl bg-white shadow-sm">
            <button
              onClick={() => setOpen(isOpen ? null : p.id)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {PAYMENT_PURPOSE_LABELS[p.purpose]} · {kr(p.amountOre)}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {p.user?.name ?? "Anonymous"} · {formatDate(p.createdAt)}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_COLORS[p.status]}`}
              >
                {PAYMENT_STATUS_LABELS[p.status]}
              </span>
            </button>

            {isOpen && (
              <div className="space-y-2 border-t border-stone-100 p-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-500">
                  <span>Captured: {kr(p.capturedOre)}</span>
                  <span>Refunded: {kr(p.refundedOre)}</span>
                  <span className="col-span-2 truncate">{p.description}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === "AUTHORIZED" && (
                    <>
                      <AmountControl
                        label="Capture"
                        tone="primary"
                        maxKr={Math.floor((p.amountOre - p.capturedOre) / 100)}
                        busy={busy}
                        onSubmit={(amountKr) =>
                          capture.mutate({ reference: p.reference, amountKr })
                        }
                      />
                      <ActionButton
                        label="Cancel reserve"
                        tone="danger"
                        busy={busy}
                        onClick={() => cancel.mutate({ reference: p.reference })}
                      />
                    </>
                  )}
                  {p.status === "PAID" && refundable > 0 && (
                    <AmountControl
                      label="Refund"
                      tone="warn"
                      maxKr={Math.floor(refundable / 100)}
                      busy={busy}
                      onSubmit={(amountKr) =>
                        refund.mutate({ reference: p.reference, amountKr })
                      }
                    />
                  )}
                  {p.status !== "AUTHORIZED" &&
                    !(p.status === "PAID" && refundable > 0) && (
                      <span className="text-xs text-stone-400">
                        No actions available.
                      </span>
                    )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {q.data && q.data.payments.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 shadow-sm">
          No payments yet.
        </div>
      )}
    </div>
  );
}

function Subscriptions() {
  const utils = api.useUtils();
  const q = api.subscription.all.useQuery(undefined, { retry: false });
  const [open, setOpen] = useState<string | null>(null);
  const stop = api.subscription.stop.useMutation({
    onSuccess: () => utils.subscription.all.invalidate(),
  });

  if (q.isError) {
    return <p className="text-sm text-stone-500">Requires admin access.</p>;
  }

  return (
    <div className="space-y-2">
      {q.data?.agreements.map((a) => {
        const isOpen = open === a.id;
        return (
          <div key={a.id} className="rounded-2xl bg-white shadow-sm">
            <button
              onClick={() => setOpen(isOpen ? null : a.id)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {kr(a.amountOre)} {AGREEMENT_INTERVAL_SUFFIX[a.interval]}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {a.user?.name ?? "Unknown"} · {a.description}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${AGREEMENT_STATUS_COLORS[a.status]}`}
              >
                {AGREEMENT_STATUS_LABELS[a.status]}
              </span>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-stone-100 p-3">
                <Charges agreementId={a.id} />
                {a.status === "ACTIVE" && (
                  <ActionButton
                    label={stop.isPending ? "Stopping…" : "Stop subscription"}
                    tone="danger"
                    busy={stop.isPending}
                    onClick={() => {
                      if (confirm("Stop this subscription?")) stop.mutate({ id: a.id });
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
      {q.data && q.data.agreements.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 shadow-sm">
          No subscriptions yet.
        </div>
      )}
    </div>
  );
}

function Charges({ agreementId }: { agreementId: string }) {
  const utils = api.useUtils();
  const q = api.subscription.charges.useQuery({ agreementId });
  const refresh = () => {
    void utils.subscription.charges.invalidate({ agreementId });
    void utils.subscription.all.invalidate();
  };
  const capture = api.subscription.captureCharge.useMutation({ onSuccess: refresh });
  const refund = api.subscription.refundCharge.useMutation({ onSuccess: refresh });
  const cancel = api.subscription.cancelCharge.useMutation({ onSuccess: refresh });
  const busy = capture.isPending || refund.isPending || cancel.isPending;

  if (!q.data?.length) {
    return <p className="text-xs text-stone-400">No charges yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-stone-500">Charges</div>
      {q.data.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs"
        >
          <div className="flex-1">
            <div className="font-medium">{kr(c.amountOre)}</div>
            <div className="text-stone-400">
              due {formatDate(c.due)} · {c.status}
            </div>
          </div>
          {(c.status === "RESERVED" || c.status === "DUE") && (
            <button
              disabled={busy}
              onClick={() => capture.mutate({ agreementId, chargeId: c.id })}
              className="rounded-lg bg-indigo-600 px-2 py-1 font-medium text-white disabled:opacity-50"
            >
              Capture
            </button>
          )}
          {c.status === "CHARGED" && (
            <button
              disabled={busy}
              onClick={() =>
                confirm("Refund this charge?") &&
                refund.mutate({ agreementId, chargeId: c.id })
              }
              className="rounded-lg bg-amber-100 px-2 py-1 font-medium text-amber-800 disabled:opacity-50"
            >
              Refund
            </button>
          )}
          {(c.status === "PENDING" || c.status === "RESERVED" || c.status === "DUE") && (
            <button
              disabled={busy}
              onClick={() => cancel.mutate({ agreementId, chargeId: c.id })}
              className="rounded-lg bg-stone-200 px-2 py-1 font-medium text-stone-600 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  label,
  tone,
  busy,
  onClick,
}: {
  label: string;
  tone: "primary" | "danger";
  busy: boolean;
  onClick: () => void;
}) {
  const cls =
    tone === "primary"
      ? "bg-indigo-600 text-white"
      : "bg-red-50 text-red-700";
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${cls}`}
    >
      {label}
    </button>
  );
}

// Amount + submit control for partial capture/refund. Defaults to the full
// remaining amount; the operator can lower it for a partial operation.
function AmountControl({
  label,
  tone,
  maxKr,
  busy,
  onSubmit,
}: {
  label: string;
  tone: "primary" | "warn";
  maxKr: number;
  busy: boolean;
  onSubmit: (amountKr: number) => void;
}) {
  const [amount, setAmount] = useState(String(maxKr));
  const btn =
    tone === "primary"
      ? "bg-indigo-600 text-white"
      : "bg-amber-100 text-amber-800";
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        max={maxKr}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-20 rounded-lg border border-stone-200 px-2 py-1 text-xs outline-none focus:border-indigo-500"
      />
      <button
        disabled={busy || Number(amount) < 1 || Number(amount) > maxKr}
        onClick={() => onSubmit(Number(amount))}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${btn}`}
      >
        {label}
      </button>
      <span className="text-[10px] text-stone-400">max {maxKr} kr</span>
    </div>
  );
}
