"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * An interactive walk through the real Vipps payment states.
 *
 * Deliberately NOT a fake live feed — nothing here pretends to be a payment
 * happening right now. It teaches the state machine, including the trap that
 * costs people money: a payment stays AUTHORIZED after you capture it, so
 * "AUTHORIZED means not captured yet" leads straight to double capture.
 */

type StateId = "CREATED" | "AUTHORIZED" | "CAPTURED" | "ABORTED" | "EXPIRED";

type StateInfo = {
  id: StateId;
  vippsState: string;
  tone: "wait" | "good" | "bad";
  label: Record<Locale, string>;
  means: Record<Locale, string>;
  todo: Record<Locale, string>;
  trap?: Record<Locale, string>;
};

const STATES: StateInfo[] = [
  {
    id: "CREATED",
    vippsState: "CREATED",
    tone: "wait",
    label: { no: "Opprettet", en: "Created" },
    means: {
      no: "Betalingen finnes hos Vipps, og kunden er sendt til appen. Ingen penger er rørt.",
      en: "The payment exists at Vipps and the customer has been sent to the app. No money has moved.",
    },
    todo: {
      no: "Lagre referansen din og vis en ventetilstand. Ikke lever varen.",
      en: "Store your reference and show a waiting state. Do not deliver the goods.",
    },
  },
  {
    id: "AUTHORIZED",
    vippsState: "AUTHORIZED",
    tone: "good",
    label: { no: "Reservert", en: "Authorized" },
    means: {
      no: "Kunden har godkjent. Beløpet er reservert på kundens konto, men ikke trukket.",
      en: "The customer approved. The amount is reserved on their account but not captured.",
    },
    todo: {
      no: "Trekk beløpet (capture) når du leverer. Skal du ikke levere, må du kansellere — ellers står kundens penger unødvendig sperret.",
      en: "Capture when you deliver. If you will not deliver, cancel — otherwise the customer's money stays needlessly held.",
    },
  },
  {
    id: "CAPTURED",
    vippsState: "AUTHORIZED",
    tone: "good",
    label: { no: "Trukket", en: "Captured" },
    means: {
      no: "Pengene er dine. Men Vipps' tilstand står fortsatt på AUTHORIZED.",
      en: "The money is yours. But the Vipps state still reads AUTHORIZED.",
    },
    todo: {
      no: "Hold styr på trukket beløp selv. Dette repoet lagrer capturedOre på betalingen.",
      en: "Track the captured amount yourself. This repo stores capturedOre on the payment.",
    },
    trap: {
      no: "Her ligger den dyre feilen: tilstanden endrer seg ikke når du trekker. Behandler du «AUTHORIZED» som «ikke trukket ennå», trekker du kunden to ganger.",
      en: "This is the expensive mistake: the state does not change when you capture. Treat “AUTHORIZED” as “not captured yet” and you charge the customer twice.",
    },
  },
  {
    id: "ABORTED",
    vippsState: "ABORTED",
    tone: "bad",
    label: { no: "Avbrutt", en: "Aborted" },
    means: {
      no: "Kunden avbrøt i Vipps-appen. Ingenting er reservert.",
      en: "The customer cancelled in the Vipps app. Nothing is reserved.",
    },
    todo: {
      no: "Slipp ordren og la kunden prøve igjen. Ikke lag en ny betaling automatisk.",
      en: "Release the order and let the customer retry. Do not create a new payment automatically.",
    },
  },
  {
    id: "EXPIRED",
    vippsState: "EXPIRED",
    tone: "bad",
    label: { no: "Utløpt", en: "Expired" },
    means: {
      no: "Kunden gjorde ingenting i tide, og Vipps lukket betalingen.",
      en: "The customer did nothing in time and Vipps closed the payment.",
    },
    todo: {
      no: "Samme som avbrutt. Merk at en reservasjon du aldri trekker, også kanselleres automatisk etter fristen.",
      en: "Same as aborted. Note that a reservation you never capture is also cancelled automatically after the deadline.",
    },
  },
];

const copy = {
  no: {
    eyebrow: "Tilstandene",
    title: "Hva skjer med en betaling.",
    lead: "Klikk deg gjennom tilstandene en ekte Vipps-betaling går gjennom, og hva appen din må gjøre i hver av dem.",
    means: "Hva det betyr",
    todo: "Hva appen din skal gjøre",
    trap: "Fellen",
    vippsSays: "Vipps rapporterer",
    tryLive: "Prøv en ekte QR-betaling med live statusoppdatering",
  },
  en: {
    eyebrow: "The states",
    title: "What happens to a payment.",
    lead: "Click through the states a real Vipps payment moves through, and what your app must do in each.",
    means: "What it means",
    todo: "What your app should do",
    trap: "The trap",
    vippsSays: "Vipps reports",
    tryLive: "Try a real QR payment with live status updates",
  },
} satisfies Record<Locale, Record<string, string>>;

export function PaymentStates({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [active, setActive] = useState<StateId>("AUTHORIZED");
  const state = STATES.find((s) => s.id === active) ?? STATES[0]!;

  return (
    <section id="tilstander" className="scroll-mt-8">
      <div className="max-w-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
          {c.eyebrow}
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{c.lead}</p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="flex flex-wrap gap-2" role="tablist">
          {STATES.map((s) => {
            const selected = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                  selected
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${
                    s.tone === "good"
                      ? "bg-emerald-500"
                      : s.tone === "bad"
                        ? "bg-red-400"
                        : "bg-amber-400"
                  }`}
                />
                {s.label[locale]}
              </button>
            );
          })}
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6">
          <div className="font-mono text-xs font-bold text-stone-400">
            {c.vippsSays}:{" "}
            <span className="text-stone-900">{state.vippsState}</span>
          </div>

          <dl className="mt-4 space-y-4 text-sm leading-6">
            <div>
              <dt className="text-xs font-black uppercase tracking-wider text-stone-400">
                {c.means}
              </dt>
              <dd className="mt-1 text-stone-700">{state.means[locale]}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-wider text-stone-400">
                {c.todo}
              </dt>
              <dd className="mt-1 text-stone-700">{state.todo[locale]}</dd>
            </div>
          </dl>

          {state.trap && (
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong className="font-black">{c.trap}: </strong>
              {state.trap[locale]}
            </p>
          )}
        </div>
      </div>

      <Link
        href="/billing"
        className="mt-5 inline-block text-sm font-bold text-[#ff5b24] underline-offset-4 hover:underline"
      >
        {c.tryLive} →
      </Link>
    </section>
  );
}
