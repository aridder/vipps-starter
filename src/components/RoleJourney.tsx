"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type Perspective = "customer" | "admin";

const copy = {
  no: {
    eyebrow: "Se hele flyten",
    title: "Samme Vipps-integrasjon. To helt ulike behov.",
    intro:
      "Bytt perspektiv for å se nøyaktig hva kunden opplever, og hva administratoren kan følge opp.",
    customer: "Jeg er kunde",
    admin: "Jeg er administrator",
    customerTitle: "Fra første klikk til full kontroll",
    customerBody:
      "Kunden slipper skjemaer, kortnumre og usikkerhet. Alt godkjennes i Vipps, og historikken ligger samlet på Min side.",
    adminTitle: "Fra innbetaling til avstemming",
    adminBody:
      "Administratoren får status, beløp og neste handling på ett sted – uten å måtte tolke rådata fra Vipps.",
    customerCta: "Prøv kundereisen",
    adminCta: "Logg inn som administrator",
    customerSteps: [
      ["1", "Logg inn", "Vipps deler verifisert navn og kontaktinformasjon etter samtykke."],
      ["2", "Velg betaling", "Betal én gang, eller opprett en månedlig eller årlig avtale."],
      ["3", "Godkjenn i Vipps", "Kunden sendes trygt til Vipps og tilbake når handlingen er godkjent."],
      ["4", "Få oversikt", "Se kvittering, betalingsstatus og administrer aktive avtaler på Min side."],
    ],
    adminSteps: [
      ["1", "Følg pengestrømmen", "Se om en betaling venter, er reservert, trukket eller refundert."],
      ["2", "Utfør riktig handling", "Trekk en reservasjon, refunder helt eller delvis, eller kanseller."],
      ["3", "Administrer avtaler", "Se aktive abonnement, kommende trekk og stopp avtaler ved behov."],
      ["4", "Stol på statusen", "Signerte webhooks varsler, mens autoritative API-oppslag bekrefter fasiten."],
    ],
  },
  en: {
    eyebrow: "See the complete flow",
    title: "One Vipps integration. Two very different needs.",
    intro:
      "Switch perspective to see exactly what the customer experiences and what an administrator can manage.",
    customer: "I am a customer",
    admin: "I am an administrator",
    customerTitle: "From first click to full control",
    customerBody:
      "The customer avoids forms, card numbers and uncertainty. Everything is approved in Vipps, with history collected on My page.",
    adminTitle: "From payment to reconciliation",
    adminBody:
      "The administrator gets status, amount and the next action in one place – without interpreting raw Vipps data.",
    customerCta: "Try the customer journey",
    adminCta: "Sign in as administrator",
    customerSteps: [
      ["1", "Sign in", "Vipps shares verified name and contact information after consent."],
      ["2", "Choose payment", "Pay once, or create a monthly or yearly agreement."],
      ["3", "Approve in Vipps", "The customer is sent securely to Vipps and back after approval."],
      ["4", "Stay in control", "See receipts, payment status and manage active agreements on My page."],
    ],
    adminSteps: [
      ["1", "Follow the money", "See whether a payment is pending, reserved, captured or refunded."],
      ["2", "Take the right action", "Capture a reserve, refund fully or partially, or cancel."],
      ["3", "Manage agreements", "See active subscriptions, upcoming charges and stop agreements when needed."],
      ["4", "Trust the status", "Signed webhooks notify you while authoritative API lookups confirm the truth."],
    ],
  },
} satisfies Record<Locale, Record<string, string | string[][]>>;

export function RoleJourney({ locale }: { locale: Locale }) {
  const [perspective, setPerspective] = useState<Perspective>("customer");
  const c = copy[locale];
  const isCustomer = perspective === "customer";
  const steps = (isCustomer ? c.customerSteps : c.adminSteps) as string[][];

  return (
    <section id="journeys" className="scroll-mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
          {c.eyebrow as string}
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {c.title as string}
        </h2>
        <p className="mt-3 text-stone-600">{c.intro as string}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_-40px_rgba(28,25,23,0.45)]">
        <div className="grid border-b border-stone-200 bg-stone-50 p-2 sm:grid-cols-2">
          {(["customer", "admin"] as Perspective[]).map((value) => {
            const active = perspective === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setPerspective(value)}
                className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-500 hover:bg-white hover:text-stone-900"
                }`}
              >
                {value === "customer" ? (c.customer as string) : (c.admin as string)}
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-8">
          <div className="max-w-2xl">
            <div
              className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                isCustomer
                  ? "bg-[#ff5b24]/10 text-[#d93f0b]"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {isCustomer ? (c.customer as string) : (c.admin as string)}
            </div>
            <h3 className="text-2xl font-black">
              {(isCustomer ? c.customerTitle : c.adminTitle) as string}
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {(isCustomer ? c.customerBody : c.adminBody) as string}
            </p>
          </div>

          <ol className="mt-7 grid gap-3 md:grid-cols-2">
            {steps.map(([number, title, body]) => (
              <li
                key={number}
                className="group rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-md"
              >
                <div className="flex gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      isCustomer
                        ? "bg-[#ff5b24] text-white"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {number}
                  </span>
                  <div>
                    <div className="font-bold">{title}</div>
                    <p className="mt-1 text-sm leading-5 text-stone-500">{body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href={isCustomer ? "/billing" : "/login"}
            className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 sm:w-auto ${
              isCustomer
                ? "bg-[#ff5b24] shadow-[0_12px_30px_-12px_rgba(255,91,36,0.75)]"
                : "bg-indigo-600 shadow-[0_12px_30px_-12px_rgba(79,70,229,0.75)]"
            }`}
          >
            {(isCustomer ? c.customerCta : c.adminCta) as string} →
          </Link>
        </div>
      </div>
    </section>
  );
}
