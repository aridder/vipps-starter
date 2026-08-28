"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";
import {
  AGREEMENT_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  formatDate,
} from "@/lib/labels";
import type { AgreementStatus, PaymentPurpose, PaymentStatus } from "@prisma/client";

function kr(ore: number) {
  return `${(ore / 100).toLocaleString("en-GB")} kr`;
}

type Tab = "overview" | "payments" | "subscriptions" | "reports";

export default function BillingAdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const features = api.meta.features.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });
  const { locale, t } = useI18n();

  if (features.isLoading || me.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-56 animate-pulse rounded-[2rem] bg-stone-200" />
        <div className="h-40 animate-pulse rounded-[2rem] bg-stone-200" />
      </div>
    );
  }

  if (me.isError || !me.data?.isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-[2rem] border border-stone-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl">
          🔒
        </div>
        <h1 className="mt-4 text-xl font-black">
          {locale === "no" ? "Kun for administratorer" : "Administrators only"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          {locale === "no"
            ? "Logg inn med en bruker som har rollen ADMIN eller OWNER for å se betalinger og utføre pengeoperasjoner."
            : "Sign in with an ADMIN or OWNER account to see payments and perform money operations."}
        </p>
        <a
          href="/login"
          className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white"
        >
          {t("nav.signIn")} →
        </a>
      </div>
    );
  }

  // Gated by the `paymentAdmin` flag (off by default). When disabled the whole
  // console is hidden and its endpoints reject — nothing here is in use.
  if (features.isSuccess && !features.data.paymentAdmin) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        {t("admin.disabled")}
      </div>
    );
  }
  if (!features.data?.paymentAdmin) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="overflow-hidden rounded-[2rem] bg-indigo-700 p-6 text-white sm:p-8">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">
          {locale === "no" ? "Administratorområde" : "Administrator area"}
        </div>
        <h1 className="mt-3 text-3xl font-black">
          {locale === "no" ? "Vipps driftssentral" : "Vipps operations"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
          {locale === "no"
            ? "Se hva som har skjedd, forstå statusen og utfør riktig handling. Alle pengeoperasjoner er rollebeskyttet og sendes direkte til Vipps."
            : "See what happened, understand the status and take the right action. Every money operation is role-protected and sent directly to Vipps."}
        </p>
        <div className="mt-6 grid gap-2 text-xs sm:grid-cols-4">
          {[
            locale === "no" ? "1 · Hendelse mottas" : "1 · Event received",
            locale === "no" ? "2 · Signatur valideres" : "2 · Signature validated",
            locale === "no" ? "3 · Status hentes" : "3 · Status fetched",
            locale === "no" ? "4 · Dashboard oppdateres" : "4 · Dashboard updated",
          ].map((item) => (
            <div key={item} className="rounded-xl bg-white/10 px-3 py-2.5 font-bold">
              {item}
            </div>
          ))}
        </div>
      </header>

      <div className={`grid gap-1 rounded-2xl bg-stone-200 p-1 ${
        features.data.reports ? "sm:grid-cols-4" : "sm:grid-cols-3"
      }`}>
        {(
          [
            "overview",
            "payments",
            "subscriptions",
            ...(features.data.reports ? (["reports"] as const) : []),
          ] as Tab[]
        ).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-xl py-3 text-sm font-black transition-colors ${
              tab === value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
            }`}
          >
            {value === "reports"
              ? locale === "no"
                ? "Avstemming"
                : "Reconciliation"
              : t(`admin.tab.${value}`)}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "payments" && <Payments />}
      {tab === "subscriptions" && <Subscriptions />}
      {tab === "reports" && <ReportReconciliation />}
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
  const { locale, t } = useI18n();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi
          label={t("admin.kpi.net")}
          value={d ? kr(Math.round((d.netKr ?? 0) * 100)) : "–"}
          accent="text-emerald-700"
        />
        <Kpi label={t("admin.kpi.captured")} value={d ? kr(Math.round(d.capturedKr * 100)) : "–"} />
        <Kpi
          label={t("admin.kpi.refunded")}
          value={d ? kr(Math.round(d.refundedKr * 100)) : "–"}
          accent="text-violet-700"
        />
        <Kpi label={t("admin.kpi.reserved")} value={d ? String(d.reservedCount) : "–"} accent="text-sky-700" />
        <Kpi label={t("admin.kpi.paid")} value={d ? String(d.paidCount) : "–"} />
        <Kpi
          label={t("admin.kpi.activeSubs")}
          value={s.data ? String(s.data.activeCount) : "–"}
          accent="text-emerald-700"
        />
      </div>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-6">
        <div className="text-xs font-black uppercase tracking-wider text-stone-400">
          {locale === "no" ? "Hva betyr statusene?" : "What do the statuses mean?"}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            [
              locale === "no" ? "Reservert" : "Reserved",
              locale === "no"
                ? "Kunden har godkjent. Beløpet holdes, men er ikke trukket ennå. Du kan trekke eller kansellere."
                : "The customer approved. Funds are held but not captured. You can capture or cancel.",
            ],
            [
              locale === "no" ? "Betalt" : "Paid",
              locale === "no"
                ? "Beløpet er trukket. Du kan refundere hele eller deler av gjenstående beløp."
                : "Funds are captured. You can refund all or part of the remaining amount.",
            ],
            [
              locale === "no" ? "Aktiv avtale" : "Active agreement",
              locale === "no"
                ? "Kunden har samtykket til fremtidige trekk. Kommende trekk opprettes før forfall."
                : "The customer consented to future charges. Upcoming charges are created before due date.",
            ],
            [
              locale === "no" ? "Refundert" : "Refunded",
              locale === "no"
                ? "Hele det trukne beløpet er tilbakeført til kunden via Vipps."
                : "The full captured amount has been returned to the customer through Vipps.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-stone-50 p-4">
              <div className="font-black">{title}</div>
              <p className="mt-1 text-sm leading-6 text-stone-500">{body}</p>
            </div>
          ))}
        </div>
      </section>
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
  const { locale, t } = useI18n();

  return (
    <div className="space-y-2">
      <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-600">
        <span className="font-black text-stone-900">
          {locale === "no" ? "Slik bruker du listen: " : "How to use this list: "}
        </span>
        {locale === "no"
          ? "Åpne en betaling for å se trukket og refundert beløp. Bare handlinger som er gyldige for statusen vises."
          : "Open a payment to see captured and refunded amounts. Only actions valid for the current status are shown."}
      </div>
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
                  {paymentPurposeLabel(p.purpose, t)} · {kr(p.amountOre)}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {p.user?.name ?? (locale === "no" ? "Anonym" : "Anonymous")} · {formatDate(p.createdAt, locale)}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_COLORS[p.status]}`}
              >
                {paymentStatusLabel(p.status, t)}
              </span>
            </button>

            {isOpen && (
              <div className="space-y-2 border-t border-stone-100 p-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-500">
                  <span>{t("admin.captured")}: {kr(p.capturedOre)}</span>
                  <span>{t("admin.refunded")}: {kr(p.refundedOre)}</span>
                  <span className="col-span-2 truncate">{p.description}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === "AUTHORIZED" && (
                    <>
                      <AmountControl
                        label={t("admin.capture")}
                        tone="primary"
                        maxKr={Math.floor((p.amountOre - p.capturedOre) / 100)}
                        busy={busy}
                        onSubmit={(amountKr) =>
                          capture.mutate({ reference: p.reference, amountKr })
                        }
                      />
                      <ActionButton
                        label={t("admin.cancelReserve")}
                        tone="danger"
                        busy={busy}
                        onClick={() => cancel.mutate({ reference: p.reference })}
                      />
                    </>
                  )}
                  {p.status === "PAID" && refundable > 0 && (
                    <AmountControl
                      label={t("admin.refund")}
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
                        {t("admin.noActions")}
                      </span>
                    )}
                </div>
                <PaymentVippsDetails reference={p.reference} />
              </div>
            )}
          </div>
        );
      })}
      {q.data && q.data.payments.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 shadow-sm">
          {t("admin.noPayments")}
        </div>
      )}
    </div>
  );
}

function PaymentVippsDetails({ reference }: { reference: string }) {
  const { locale } = useI18n();
  const details = api.payment.details.useQuery(
    { reference },
    { retry: false, staleTime: 30_000 },
  );
  if (details.isLoading) {
    return (
      <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
    );
  }
  if (details.isError) {
    return (
      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        {locale === "no"
          ? `Kunne ikke hente live-detaljer fra Vipps: ${details.error.message}`
          : `Could not fetch live details from Vipps: ${details.error.message}`}
      </p>
    );
  }
  const data = details.data;
  if (!data) return null;
  const address = data.shippingDetails?.address;
  return (
    <div className="space-y-3 rounded-xl bg-stone-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-stone-400">
          {locale === "no" ? "Vipps live-detaljer" : "Vipps live details"}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-stone-500">
          {data.state}
        </span>
      </div>
      {(data.shippingDetails || data.userDetails) && (
        <div className="grid gap-3 text-xs text-stone-600 sm:grid-cols-2">
          <div>
            <div className="font-black text-stone-900">
              {locale === "no" ? "Mottaker" : "Recipient"}
            </div>
            <div className="mt-1">
              {[data.userDetails?.firstName, data.userDetails?.lastName]
                .filter(Boolean)
                .join(" ") || "–"}
            </div>
            <div>{data.userDetails?.email ?? "–"}</div>
            <div>{data.userDetails?.mobileNumber ?? "–"}</div>
          </div>
          <div>
            <div className="font-black text-stone-900">
              {data.shippingDetails?.shippingOptionName ??
                (locale === "no" ? "Levering" : "Delivery")}
            </div>
            <div className="mt-1">
              {[address?.addressLine1, address?.addressLine2]
                .filter(Boolean)
                .join(", ") || "–"}
            </div>
            <div>
              {[address?.postCode, address?.city].filter(Boolean).join(" ")}
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="mb-1 text-xs font-black text-stone-900">
          {locale === "no" ? "Hendelseslogg" : "Event log"}
        </div>
        <div className="space-y-1">
          {data.events.map((event) => (
            <div
              key={`${event.timestamp}-${event.name}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-2 text-[11px]"
            >
              <span className="font-bold">{event.name}</span>
              <span className="text-stone-400">
                {event.amount ? kr(event.amount.value) : ""}
                {event.amount ? " · " : ""}
                {formatDate(new Date(event.timestamp), locale)}
              </span>
            </div>
          ))}
          {data.events.length === 0 && (
            <span className="text-xs text-stone-400">
              {locale === "no" ? "Ingen hendelser ennå." : "No events yet."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function ReportReconciliation() {
  const { locale, t } = useI18n();
  const [date, setDate] = useState(localDate);
  const report = api.report.overview.useQuery(
    { date },
    { retry: false, staleTime: 60_000 },
  );
  const data = report.data;
  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Vipps Report API
            </div>
            <h2 className="mt-2 text-2xl font-black">
              {locale === "no" ? "Avstem penger og gebyrer" : "Reconcile funds and fees"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              {locale === "no"
                ? "Funds viser pengebevegelsene. Fees viser Vipps-gebyrene. Rapportdata er asynkrone og skal ikke brukes som fasit for statusen til én betaling."
                : "Funds shows money movements. Fees shows Vipps fees. Report data is asynchronous and must not be used as the source of truth for an individual payment."}
            </p>
          </div>
          <label className="shrink-0 text-xs font-black uppercase tracking-wider text-stone-400">
            {locale === "no" ? "Ledger-dato" : "Ledger date"}
            <input
              type="date"
              value={date}
              max={localDate()}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 block rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-900"
            />
          </label>
        </div>
      </section>

      {report.isLoading ? (
        <div className="h-40 animate-pulse rounded-[2rem] bg-stone-200" />
      ) : report.isError ? (
        <ReportNotice
          text={
            locale === "no"
              ? `Kunne ikke hente rapport: ${report.error.message}`
              : `Could not fetch report: ${report.error.message}`
          }
        />
      ) : data && !data.available ? (
        <ReportNotice
          text={
            "reasonCode" in data && data.reasonCode
              ? t(`reason.${data.reasonCode}`)
              : ("reason" in data && data.reason) || ""
          }
        />
      ) : data?.available ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi
              label={locale === "no" ? "Funds netto" : "Funds net"}
              value={kr(data.fundsNetOre)}
              accent="text-emerald-700"
            />
            <Kpi
              label={locale === "no" ? "Gebyrer netto" : "Fees net"}
              value={kr(data.feesNetOre)}
              accent="text-violet-700"
            />
            <Kpi
              label={locale === "no" ? "Poster" : "Entries"}
              value={String(data.funds.length + data.fees.length)}
            />
          </div>
          {(data.tryLater || data.truncated) && (
            <ReportNotice
              text={
                data.tryLater
                  ? locale === "no"
                    ? "Vipps behandler fortsatt data for denne dagen. Prøv igjen senere."
                    : "Vipps is still processing this date. Try again later."
                  : locale === "no"
                    ? "Dagen har flere enn 200 poster. Bruk full eksport før bokføring."
                    : "The date has more than 200 entries. Use a full export before posting."
              }
            />
          )}
          <ReportEntries
            title={locale === "no" ? "Pengebevegelser" : "Funds"}
            entries={data.funds}
            locale={locale}
          />
          <ReportEntries
            title={locale === "no" ? "Gebyrer" : "Fees"}
            entries={data.fees}
            locale={locale}
          />
        </>
      ) : null}
    </div>
  );
}

function ReportNotice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      {text}
    </div>
  );
}

function ReportEntries({
  title,
  entries,
  locale,
}: {
  title: string;
  entries: Array<{
    pspReference?: string;
    time: string;
    entryType: string;
    reference?: string;
    currency: string;
    amount: number;
  }>;
  locale: "no" | "en";
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <h3 className="font-black">{title}</h3>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold">
          {entries.length}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="p-5 text-sm text-stone-500">
          {locale === "no" ? "Ingen poster denne dagen." : "No entries for this date."}
        </p>
      ) : (
        <div className="divide-y divide-stone-100">
          {entries.map((entry, index) => (
            <div
              key={`${entry.pspReference ?? entry.reference ?? index}-${entry.time}`}
              className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="font-bold">{entry.entryType}</div>
                <div className="truncate text-xs text-stone-400">
                  {entry.reference ?? entry.pspReference ?? "–"} ·{" "}
                  {formatDate(new Date(entry.time), locale)}
                </div>
              </div>
              <div
                className={`font-black ${
                  entry.amount < 0 ? "text-violet-700" : "text-emerald-700"
                }`}
              >
                {kr(entry.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Subscriptions() {
  const utils = api.useUtils();
  const q = api.subscription.all.useQuery(undefined, { retry: false });
  const [open, setOpen] = useState<string | null>(null);
  const stop = api.subscription.stop.useMutation({
    onSuccess: () => utils.subscription.all.invalidate(),
  });
  const { locale, t } = useI18n();

  if (q.isError) {
    return <p className="text-sm text-stone-500">{t("admin.requiresAdmin")}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-600">
        <span className="font-black text-stone-900">
          {locale === "no" ? "Avtale vs. trekk: " : "Agreement vs. charge: "}
        </span>
        {locale === "no"
          ? "Avtalen er kundens samtykke. Hvert trekk er en separat betaling med egen forfallsdato og status."
          : "The agreement is the customer consent. Each charge is a separate payment with its own due date and status."}
      </div>
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
                  {kr(a.amountOre)} {t(a.interval === "MONTH" ? "per.mo" : "per.yr")}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {a.user?.name ?? (locale === "no" ? "Ukjent" : "Unknown")} · {a.description}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${AGREEMENT_STATUS_COLORS[a.status]}`}
              >
                {agreementStatusLabel(a.status, t)}
              </span>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-stone-100 p-3">
                <Charges agreementId={a.id} />
                {a.status === "ACTIVE" && (
                  <ActionButton
                    label={stop.isPending ? t("admin.stopping") : t("admin.stopSub")}
                    tone="danger"
                    busy={stop.isPending}
                    onClick={() => {
                      if (confirm(locale === "no" ? "Stoppe dette abonnementet?" : "Stop this subscription?")) stop.mutate({ id: a.id });
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
          {t("admin.noSubs")}
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
  const { locale, t } = useI18n();

  if (!q.data?.length) {
    return <p className="text-xs text-stone-400">{t("admin.noCharges")}</p>;
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-stone-500">{t("admin.charges")}</div>
      {q.data.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs"
        >
          <div className="flex-1">
            <div className="font-medium">{kr(c.amountOre)}</div>
            <div className="text-stone-400">
              {locale === "no" ? "forfall" : "due"} {formatDate(c.due, locale)} · {c.status}
            </div>
          </div>
          {(c.status === "RESERVED" || c.status === "DUE") && (
            <button
              disabled={busy}
              onClick={() => capture.mutate({ agreementId, chargeId: c.id })}
              className="rounded-lg bg-indigo-600 px-2 py-1 font-medium text-white disabled:opacity-50"
            >
              {t("admin.capture")}
            </button>
          )}
          {c.status === "CHARGED" && (
            <button
              disabled={busy}
              onClick={() =>
                confirm(locale === "no" ? "Refundere dette trekket?" : "Refund this charge?") &&
                refund.mutate({ agreementId, chargeId: c.id })
              }
              className="rounded-lg bg-amber-100 px-2 py-1 font-medium text-amber-800 disabled:opacity-50"
            >
              {t("admin.refund")}
            </button>
          )}
          {(c.status === "PENDING" || c.status === "RESERVED" || c.status === "DUE") && (
            <button
              disabled={busy}
              onClick={() => cancel.mutate({ agreementId, chargeId: c.id })}
              className="rounded-lg bg-stone-200 px-2 py-1 font-medium text-stone-600 disabled:opacity-50"
            >
              {locale === "no" ? "Kanseller" : "Cancel"}
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
  const { t } = useI18n();
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
      <span className="text-[10px] text-stone-400">
        {t("admin.max", { n: String(maxKr) })}
      </span>
    </div>
  );
}

function paymentPurposeLabel(
  purpose: PaymentPurpose,
  t: ReturnType<typeof useI18n>["t"],
) {
  const keys: Record<PaymentPurpose, string> = {
    ONE_TIME: "purpose.one_time",
    SUBSCRIPTION: "purpose.subscription",
    DONATION: "purpose.donation",
  };
  return t(keys[purpose]);
}

function paymentStatusLabel(
  status: PaymentStatus,
  t: ReturnType<typeof useI18n>["t"],
) {
  const keys: Record<PaymentStatus, string> = {
    CREATED: "status.pending",
    AUTHORIZED: "status.reserved",
    PAID: "status.paid",
    CANCELLED: "status.cancelled",
    FAILED: "status.failed",
    REFUNDED: "status.refunded",
  };
  return t(keys[status]);
}

function agreementStatusLabel(
  status: AgreementStatus,
  t: ReturnType<typeof useI18n>["t"],
) {
  const keys: Record<AgreementStatus, string> = {
    PENDING: "astatus.pending",
    ACTIVE: "astatus.active",
    STOPPED: "astatus.stopped",
    EXPIRED: "astatus.expired",
  };
  return t(keys[status]);
}
