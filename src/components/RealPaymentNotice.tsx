"use client";

import { api } from "@/trpc/react";
import { useI18n } from "@/components/I18nProvider";

export function RealPaymentNotice({
  recipientName,
}: {
  recipientName: string;
}) {
  const { locale } = useI18n();
  const available = api.payment.available.useQuery();
  const on = available.data?.available ?? false;
  const loading = available.isLoading;

  const tone = loading
    ? "border-stone-200 bg-stone-100 text-stone-800"
    : on
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <section
      data-testid="real-payment-notice"
      aria-live="polite"
      className={`rounded-[2rem] border px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-7 ${tone}`}
    >
      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">
          {loading
            ? locale === "no"
              ? "Sjekker Vipps-status"
              : "Checking Vipps status"
            : on
              ? locale === "no"
                ? "Ekte penger · produksjon"
                : "Real money · production"
              : locale === "no"
                ? "Produksjonsflyt · midlertidig stengt"
                : "Production flow · temporarily closed"}
        </div>
        <h2 className="mt-1 text-xl font-black tracking-tight">
          {loading
            ? locale === "no"
              ? "Donasjoner her bruker ekte Vipps-betalinger"
              : "Donations here use real Vipps payments"
            : on
              ? locale === "no"
                ? "Dette er ekte Vipps-betaling – ikke testmodus"
                : "These are real Vipps payments – not test mode"
              : locale === "no"
                ? "Ekte betalingsflyt – ingen kan trekkes akkurat nå"
                : "Real payment flow – nobody can be charged right now"}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 opacity-80">
          {loading
            ? locale === "no"
              ? "Vi sjekker produksjonsstatus før du får mulighet til å fortsette."
              : "We are checking production status before you can continue."
            : on
              ? locale === "no"
                ? `Godkjenner du en donasjon i Vipps, trekkes beløpet faktisk og går til ${recipientName}. Donasjonen er frivillig og uten motytelse. Tusen takk til alle som bidrar.`
                : `If you approve a donation in Vipps, the amount is actually charged and goes to ${recipientName}. The donation is voluntary and provides no goods or services. Thank you to everyone who contributes.`
              : locale === "no"
                ? "Løsningen bruker produksjonsbetalinger når Vipps-avtalen er aktiv. Betaling er nå sperret mens vi venter på dedikerte ePayment-nøkler, så ingen penger kan trekkes. Alle donasjoner mottas med stor takk når vi åpner."
                : "The solution uses production payments when the Vipps agreement is active. Payments are currently blocked while dedicated ePayment keys are pending, so no money can be charged. Every donation will be deeply appreciated when we open."}
        </p>
      </div>
      <a
        href="#donate"
        className="mt-4 inline-flex shrink-0 items-center justify-center rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 sm:mt-0"
      >
        {locale === "no"
          ? on
            ? "Doner med Vipps ↓"
            : "Se donasjonsflyten ↓"
          : on
            ? "Donate with Vipps ↓"
            : "See the donation flow ↓"}
      </a>
    </section>
  );
}
