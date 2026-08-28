import type { AgreementStatus, PaymentStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n";

// Only styling and formatting live here. Every user-visible STRING belongs in
// the i18n dictionary — this file used to carry English-only copies of labels
// that already existed there, which meant Norwegian users saw English.

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  CREATED: "bg-amber-100 text-amber-800",
  AUTHORIZED: "bg-sky-100 text-sky-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-100 text-stone-500",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-violet-100 text-violet-800",
};

export const AGREEMENT_STATUS_COLORS: Record<AgreementStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  STOPPED: "bg-stone-100 text-stone-500",
  EXPIRED: "bg-red-100 text-red-800",
};

export function formatDate(date: Date, locale: Locale = "no"): string {
  return new Intl.DateTimeFormat(locale === "no" ? "nb-NO" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
