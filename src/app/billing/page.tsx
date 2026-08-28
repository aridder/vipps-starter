"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AgreementInterval,
  AgreementStatus,
  PaymentPurpose,
  PaymentStatus,
} from "@prisma/client";
import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";
import {
  AGREEMENT_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  formatDate,
} from "@/lib/labels";

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
  const { locale, t } = useI18n();
  const features = api.meta.features.useQuery();
  const available = api.payment.available.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });
  const [mode, setMode] = useState<"once" | "recurring">("once");

  const on = available.data?.available ?? false;
  const recurringOn = features.data?.recurring ?? false;
  const isLoading = features.isLoading || available.isLoading;
  const loggedIn = !!me.data?.id;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="rounded-[2rem] bg-stone-900 p-6 text-white sm:p-8">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#ff7a4d]">
          {locale === "no" ? "Kundeområde" : "Customer area"}
        </div>
        <h1 className="mt-3 text-3xl font-black">
          {locale === "no" ? "Betalinger og avtaler" : "Payments and agreements"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
          {locale === "no"
            ? "Betal med Vipps, se hva som har skjedd og administrer faste avtaler. Du sendes alltid til Vipps for å godkjenne."
            : "Pay with Vipps, see what happened and manage recurring agreements. You are always sent to Vipps to approve."}
        </p>
        <div className="mt-6 grid gap-2 text-xs sm:grid-cols-3">
          {[
            locale === "no" ? "1 · Velg type og beløp" : "1 · Choose type and amount",
            locale === "no" ? "2 · Godkjenn i Vipps" : "2 · Approve in Vipps",
            locale === "no" ? "3 · Se bekreftet status" : "3 · See confirmed status",
          ].map((item) => (
            <div key={item} className="rounded-xl bg-white/10 px-3 py-2.5 font-bold">
              {item}
            </div>
          ))}
        </div>
      </header>

      {!loggedIn && !me.isLoading && (
        <div className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-black text-indigo-950">
              {locale === "no" ? "Engangsbetaling virker uten innlogging" : "One-off payment works without sign-in"}
            </div>
            <p className="mt-1 text-sm text-indigo-700">
              {locale === "no"
                ? "Logg inn med Vipps hvis du vil opprette faste avtaler og se historikken din."
                : "Sign in with Vipps to create recurring agreements and see your history."}
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-black text-white"
          >
            {locale === "no" ? "Logg inn med Vipps" : "Sign in with Vipps"} →
          </Link>
        </div>
      )}

      <section aria-labelledby="new-payment-title">
        <div className="mb-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">
            {locale === "no" ? "Ny handling" : "New action"}
          </div>
          <h2 id="new-payment-title" className="mt-1 text-2xl font-black">
            {locale === "no" ? "Hva vil du gjøre?" : "What would you like to do?"}
          </h2>
        </div>

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-[2rem] bg-white" />
        ) : !on ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <div className="font-black">
              {locale === "no" ? "Vipps-betaling er ikke tilgjengelig akkurat nå" : "Vipps payment is not available right now"}
            </div>
            <p className="mt-1">
              {available.data?.reasonCode
                ? t(`reason.${available.data.reasonCode}`)
                : t("billing.notConfigured")}
            </p>
          </div>
        ) : (
          <div className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
            {recurringOn && (
              <div className="grid gap-2 rounded-2xl bg-stone-100 p-1 sm:grid-cols-2">
                <ModeButton
                  active={mode === "once"}
                  title={t("billing.once")}
                  body={locale === "no" ? "Betales og bekreftes med én gang" : "Paid and confirmed immediately"}
                  onClick={() => setMode("once")}
                />
                <ModeButton
                  active={mode === "recurring"}
                  title={t("billing.subscription")}
                  body={locale === "no" ? "Automatiske trekk etter samtykke" : "Automatic charges after consent"}
                  onClick={() => setMode("recurring")}
                />
              </div>
            )}
            {mode === "once" || !recurringOn ? <OnceForm /> : <RecurringForm />}
          </div>
        )}
      </section>

      {on && available.data?.express && (
        <ExpressCard product={available.data.express} />
      )}

      {loggedIn && (
        <div className="grid gap-6 lg:grid-cols-2">
          <MySubscriptions />
          <MyHistory />
        </div>
      )}
    </div>
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
      className={`rounded-xl px-4 py-3 text-left transition ${
        active ? "bg-white shadow-sm" : "text-stone-500 hover:text-stone-900"
      }`}
    >
      <span className="block text-sm font-black">{title}</span>
      <span className="mt-0.5 block text-xs">{body}</span>
    </button>
  );
}

function OnceForm() {
  const { locale, t } = useI18n();
  const features = api.meta.features.useQuery();
  const [purpose, setPurpose] = useState<"ONE_TIME" | "DONATION">("ONE_TIME");
  const [amount, setAmount] = useState("100");
  const [flow, setFlow] = useState<"WEB_REDIRECT" | "QR">("WEB_REDIRECT");
  const [qrPayment, setQrPayment] = useState<{
    reference: string;
    imageUrl: string;
  } | null>(null);
  const create = api.payment.create.useMutation({
    onSuccess: (result) => {
      if (flow === "QR") {
        setQrPayment({
          reference: result.reference,
          imageUrl: result.redirectUrl,
        });
      } else {
        window.location.href = result.redirectUrl;
      }
    },
  });

  if (qrPayment) {
    return (
      <QrPayment
        reference={qrPayment.reference}
        imageUrl={qrPayment.imageUrl}
        onClose={() => setQrPayment(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ChoiceGrid
        values={["ONE_TIME", "DONATION"]}
        selected={purpose}
        labels={[
          [t("billing.payment"), locale === "no" ? "Kjøp eller engangsbeløp" : "Purchase or one-off amount"],
          [t("billing.donation"), locale === "no" ? "Støtt uten motytelse" : "Support without a purchase"],
        ]}
        onChange={(value) => {
          setPurpose(value as "ONE_TIME" | "DONATION");
          setAmount(String(ONE_OFF_PRESETS[value as "ONE_TIME" | "DONATION"][0]));
        }}
      />
      <AmountPicker
        presets={ONE_OFF_PRESETS[purpose]}
        amount={amount}
        setAmount={setAmount}
        label={t("billing.amount")}
      />
      {features.data?.paymentQr && (
        <div>
          <div className="mb-2 text-xs font-black uppercase tracking-wider text-stone-400">
            {locale === "no" ? "Hvordan vil du åpne Vipps?" : "How should Vipps open?"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={flow === "WEB_REDIRECT"}
              onClick={() => setFlow("WEB_REDIRECT")}
              className={`rounded-xl p-3 text-left text-sm ${
                flow === "WEB_REDIRECT"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              <span className="block font-black">
                {locale === "no" ? "Denne enheten" : "This device"}
              </span>
              <span className="mt-0.5 block text-xs opacity-70">
                {locale === "no" ? "Vanlig Vipps-flyt" : "Standard Vipps flow"}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={flow === "QR"}
              onClick={() => setFlow("QR")}
              className={`rounded-xl p-3 text-left text-sm ${
                flow === "QR"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              <span className="block font-black">
                {locale === "no" ? "QR på skjerm" : "QR on screen"}
              </span>
              <span className="mt-0.5 block text-xs opacity-70">
                {locale === "no" ? "Skann med mobilen" : "Scan with your phone"}
              </span>
            </button>
          </div>
        </div>
      )}
      {create.error && <ErrorMessage message={create.error.message} />}
      <button
        type="button"
        disabled={create.isPending || Number(amount) < 1}
        onClick={() =>
          create.mutate({
            purpose: PaymentPurpose[purpose],
            amountKr: Number(amount),
            flow,
          })
        }
        className="w-full rounded-2xl bg-[#ff5b24] py-3.5 font-black text-white shadow-[0_12px_30px_-14px_rgba(255,91,36,0.8)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
      >
        {create.isPending ? t("billing.opening") : t("billing.pay", { amount })}
      </button>
      <SafeNote />
    </div>
  );
}

function QrPayment({
  reference,
  imageUrl,
  onClose,
}: {
  reference: string;
  imageUrl: string;
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const status = api.payment.status.useQuery(
    { reference },
    { refetchInterval: 2500, retry: false },
  );
  const paid = status.data?.status === "PAID";
  const ended = ["CANCELLED", "FAILED", "REFUNDED"].includes(
    status.data?.status ?? "",
  );

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
      <div>
        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
            paid
              ? "bg-emerald-100 text-emerald-700"
              : ended
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {paid
            ? locale === "no"
              ? "Betaling bekreftet"
              : "Payment confirmed"
            : ended
              ? locale === "no"
                ? "Betalingen ble ikke fullført"
                : "Payment was not completed"
              : locale === "no"
                ? "Venter på godkjenning i Vipps"
                : "Waiting for approval in Vipps"}
        </div>
        <h3 className="mt-3 text-2xl font-black">
          {paid
            ? locale === "no"
              ? "Takk – Vipps har bekreftet betalingen."
              : "Thank you – Vipps confirmed the payment."
            : locale === "no"
              ? "Skann QR-koden med Vipps"
              : "Scan the QR code with Vipps"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          {locale === "no"
            ? "Statusen hentes direkte fra Vipps. Koden er normalt gyldig i omtrent ti minutter."
            : "Status is fetched directly from Vipps. The code is normally valid for about ten minutes."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-xl border border-stone-200 px-4 py-2 text-sm font-black text-stone-600"
        >
          {paid
            ? locale === "no"
              ? "Ferdig"
              : "Done"
            : locale === "no"
              ? "Avbryt og gå tilbake"
              : "Cancel and go back"}
        </button>
      </div>
      {!paid && !ended && (
        // Vipps generates and hosts this short-lived QR image. We deliberately
        // avoid injecting SVG/HTML or placing the token in our own URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={locale === "no" ? "QR-kode for Vipps-betaling" : "Vipps payment QR code"}
          className="mx-auto aspect-square w-full max-w-[220px] rounded-2xl border border-stone-200 bg-white p-2"
        />
      )}
    </div>
  );
}

function ExpressCard({
  product,
}: {
  product: {
    name: string;
    description: string;
    priceOre: number;
    shippingOre: number;
    shippingName: string;
  };
}) {
  const { locale } = useI18n();
  const create = api.payment.createExpress.useMutation({
    onSuccess: (result) => {
      window.location.href = result.redirectUrl;
    },
  });
  return (
    <section className="overflow-hidden rounded-[2rem] border border-indigo-200 bg-indigo-50 p-5 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Vipps Express
          </div>
          <h2 className="mt-2 text-2xl font-black text-indigo-950">
            {product.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-indigo-800">
            {product.description}
          </p>
          <p className="mt-3 text-xs leading-5 text-indigo-600">
            {locale === "no"
              ? `Du deler navn, adresse, e-post og telefon med selgeren i Vipps og velger ${product.shippingName.toLowerCase()} der. Opplysningene brukes til levering.`
              : `You share name, address, email and phone with the merchant in Vipps and select ${product.shippingName.toLowerCase()} there. The details are used for delivery.`}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <div className="text-lg font-black text-indigo-950">
            {product.priceOre / 100} kr
          </div>
          <div className="text-xs text-indigo-600">
            + {product.shippingOre / 100} kr {locale === "no" ? "frakt" : "shipping"}
          </div>
          <button
            type="button"
            disabled={create.isPending}
            onClick={() => create.mutate()}
            className="mt-3 w-full rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {create.isPending
              ? locale === "no"
                ? "Åpner Vipps …"
                : "Opening Vipps …"
              : locale === "no"
                ? "Kjøp med Vipps Express"
                : "Buy with Vipps Express"}
          </button>
        </div>
      </div>
      {create.error && <div className="mt-4"><ErrorMessage message={create.error.message} /></div>}
    </section>
  );
}

function RecurringForm() {
  const { locale, t } = useI18n();
  const [purpose, setPurpose] = useState<"SUBSCRIPTION" | "DONATION">("SUBSCRIPTION");
  const [interval, setInterval] = useState<AgreementInterval>("MONTH");
  const [amount, setAmount] = useState("100");
  const create = api.subscription.create.useMutation({
    onSuccess: (result) => (window.location.href = result.confirmationUrl),
  });
  const presets = RECURRING_PRESETS[purpose][interval];

  return (
    <div className="space-y-5">
      <ChoiceGrid
        values={["SUBSCRIPTION", "DONATION"]}
        selected={purpose}
        labels={[
          [t("billing.subscription"), locale === "no" ? "Fast pris per periode" : "Fixed price per period"],
          [t("billing.donation"), locale === "no" ? "Fast støtte over tid" : "Recurring support over time"],
        ]}
        onChange={(value) => {
          const next = value as "SUBSCRIPTION" | "DONATION";
          setPurpose(next);
          setAmount(String(RECURRING_PRESETS[next][interval][0]));
        }}
      />
      <div>
        <div className="mb-2 text-xs font-black uppercase tracking-wider text-stone-400">
          {t("billing.howOften")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["MONTH", "YEAR"] as AgreementInterval[]).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={interval === value}
              onClick={() => {
                setInterval(value);
                setAmount(String(RECURRING_PRESETS[purpose][value][0]));
              }}
              className={`rounded-xl py-2.5 text-sm font-bold ${
                interval === value
                  ? "bg-indigo-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {value === "YEAR" ? t("interval.year") : t("interval.month")}
            </button>
          ))}
        </div>
      </div>
      <AmountPicker
        presets={presets}
        amount={amount}
        setAmount={setAmount}
        label={t("billing.amountPer")}
      />
      {create.error && <ErrorMessage message={create.error.message} />}
      <button
        type="button"
        disabled={create.isPending || Number(amount) < 1}
        onClick={() =>
          create.mutate({
            purpose: PaymentPurpose[purpose],
            amountKr: Number(amount),
            interval,
          })
        }
        className="w-full rounded-2xl bg-[#ff5b24] py-3.5 font-black text-white shadow-[0_12px_30px_-14px_rgba(255,91,36,0.8)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
      >
        {create.isPending
          ? t("billing.opening")
          : t("billing.startSub", {
              amount,
              per: interval === "YEAR" ? t("per.yr") : t("per.mo"),
            })}
      </button>
      <SafeNote />
    </div>
  );
}

function ChoiceGrid({
  values,
  selected,
  labels,
  onChange,
}: {
  values: string[];
  selected: string;
  labels: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {values.map((value, index) => (
        <button
          type="button"
          key={value}
          aria-pressed={selected === value}
          onClick={() => onChange(value)}
          className={`rounded-2xl border p-4 text-left transition ${
            selected === value
              ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
              : "border-stone-200 hover:border-stone-300"
          }`}
        >
          <span className="block text-sm font-black">{labels[index][0]}</span>
          <span className="mt-1 block text-xs opacity-75">{labels[index][1]}</span>
        </button>
      ))}
    </div>
  );
}

function AmountPicker({
  presets,
  amount,
  setAmount,
  label,
}: {
  presets: number[];
  amount: string;
  setAmount: (value: string) => void;
  label: string;
}) {
  // `label` is display text, so interpolating it produced ids with spaces and
  // parentheses. useId is stable across server and client render.
  const fieldId = useId();
  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-xs font-black uppercase tracking-wider text-stone-400">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={amount === String(value)}
            onClick={() => setAmount(String(value))}
            className={`rounded-xl py-2.5 text-sm font-bold ${
              amount === String(value)
                ? "bg-[#ff5b24] text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {value} kr
          </button>
        ))}
      </div>
      <div className="relative mt-3">
        <input
          id={fieldId}
          type="number"
          min={1}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-full rounded-xl border border-stone-200 px-3 py-3 pr-12 font-semibold outline-none focus:border-[#ff5b24] focus:ring-4 focus:ring-[#ff5b24]/10"
        />
        <span className="absolute right-4 top-3 text-sm font-bold text-stone-400">kr</span>
      </div>
    </div>
  );
}

function SafeNote() {
  const { locale } = useI18n();
  return (
    <p className="text-center text-[11px] leading-5 text-stone-400">
      {locale === "no"
        ? "Du sendes til Vipps for godkjenning. Vi lagrer aldri kort- eller betalingskildedata."
        : "You are sent to Vipps for approval. We never store card or payment-source data."}
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {message}
    </p>
  );
}

function MySubscriptions() {
  const { locale, t } = useI18n();
  const mine = api.subscription.mine.useQuery(undefined, { retry: false });
  const utils = api.useUtils();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const stop = api.subscription.stop.useMutation({
    onSettled: () => {
      setCancelling(null);
      void utils.subscription.mine.invalidate();
    },
  });
  const agreements = mine.data?.filter((agreement) => agreement.status !== "STOPPED") ?? [];

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-stone-400">
            {locale === "no" ? "Din kontroll" : "Your control"}
          </div>
          <h2 className="mt-1 text-lg font-black">{t("billing.mySubs")}</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold">
          {agreements.length}
        </span>
      </div>
      {mine.isLoading ? (
        <div className="mt-4 h-20 animate-pulse rounded-2xl bg-stone-100" />
      ) : agreements.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-500">
          {locale === "no"
            ? "Du har ingen aktive avtaler. Når du oppretter en, kan du se neste trekk og stoppe avtalen her."
            : "You have no active agreements. When you create one, you can see the next charge and stop it here."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {agreements.map((agreement) => {
            const isCancelling = cancelling === agreement.id && stop.isPending;
            return (
              <div key={agreement.id} className="rounded-2xl bg-stone-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-black">
                      {agreement.amountOre / 100} kr{" "}
                      {agreement.interval === "YEAR" ? t("per.yr") : t("per.mo")}
                    </div>
                    <div className="mt-1 truncate text-xs text-stone-400">
                      {agreement.description}
                      {agreement.nextChargeDate
                        ? ` · ${t("billing.next")} ${formatDate(agreement.nextChargeDate, locale)}`
                        : ""}
                    </div>
                  </div>
                  <StatusPill
                    className={AGREEMENT_STATUS_COLORS[agreement.status]}
                    label={agreementStatusLabel(agreement.status, t)}
                  />
                </div>
                {agreement.status === "ACTIVE" && (
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => {
                      if (confirm(t("billing.confirmCancel"))) {
                        setCancelling(agreement.id);
                        stop.mutate({ id: agreement.id });
                      }
                    }}
                    className="mt-3 w-full rounded-xl border border-stone-200 py-2 text-sm font-bold text-stone-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    {isCancelling ? t("billing.cancelling") : t("billing.cancel")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MyHistory() {
  const { locale, t } = useI18n();
  const mine = api.payment.mine.useQuery(undefined, { retry: false });
  const payments = mine.data ?? [];
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-stone-400">
            {locale === "no" ? "Bekreftet av Vipps" : "Confirmed by Vipps"}
          </div>
          <h2 className="mt-1 text-lg font-black">{t("billing.history")}</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold">
          {payments.length}
        </span>
      </div>
      {mine.isLoading ? (
        <div className="mt-4 h-20 animate-pulse rounded-2xl bg-stone-100" />
      ) : payments.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-500">
          {locale === "no"
            ? "Ingen betalinger ennå. Fullfør en betaling, så ser du beløp, dato og bekreftet status her."
            : "No payments yet. Complete a payment to see amount, date and confirmed status here."}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold">{payment.amountOre / 100} kr</div>
                <div className="truncate text-xs text-stone-400">
                  {payment.description} · {formatDate(payment.createdAt, locale)}
                </div>
              </div>
              <StatusPill
                className={PAYMENT_STATUS_COLORS[payment.status]}
                label={paymentStatusLabel(payment.status, t)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusPill({ className, label }: { className: string; label: string }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${className}`}>
      {label}
    </span>
  );
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
