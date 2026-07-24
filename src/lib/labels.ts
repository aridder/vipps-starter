import type {
  AgreementInterval,
  AgreementStatus,
  PaymentPurpose,
  PaymentStatus,
} from "@prisma/client";

export const PAYMENT_PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  ONE_TIME: "One-time",
  SUBSCRIPTION: "Subscription",
  DONATION: "Donation",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  CREATED: "Pending",
  AUTHORIZED: "Reserved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  CREATED: "bg-amber-100 text-amber-800",
  AUTHORIZED: "bg-sky-100 text-sky-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-100 text-stone-500",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-violet-100 text-violet-800",
};

export const AGREEMENT_INTERVAL_LABELS: Record<AgreementInterval, string> = {
  MONTH: "Monthly",
  YEAR: "Yearly",
};

export const AGREEMENT_INTERVAL_SUFFIX: Record<AgreementInterval, string> = {
  MONTH: "/ mo",
  YEAR: "/ yr",
};

export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  PENDING: "Awaiting approval",
  ACTIVE: "Active",
  STOPPED: "Stopped",
  EXPIRED: "Expired",
};

export const AGREEMENT_STATUS_COLORS: Record<AgreementStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  STOPPED: "bg-stone-100 text-stone-500",
  EXPIRED: "bg-red-100 text-red-800",
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
