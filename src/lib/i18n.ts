// Minimal, dependency-free i18n. Default Norwegian ("no"), English ("en")
// supported. Locale comes from the NEXT_LOCALE cookie (see I18nProvider /
// LocaleSwitcher). `translator(locale)` works on both server and client.

export const locales = ["no", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "no";

export function resolveLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "no";
}

type Dict = Record<string, string>;

const no: Dict = {
  "nav.home": "Hjem",
  "nav.settings": "Innstillinger",
  "nav.signIn": "Logg inn",



  "donate.title": "Støtt prosjektet 💜",
  "donate.sub":
    "Hvis {name} sparer deg tid, spander det du kan. Hver krone hjelper med å holde det vedlike.",
  "donate.once": "Engang",
  "donate.recurring": "Månedlig / årlig",
  "donate.signInRecurring": "Logg inn med Vipps for å sette opp fast støtte",
  "donate.opening": "Åpner Vipps …",
  "donate.donate": "Doner {amount} kr med Vipps",
  "donate.support": "Støtt {amount} kr {per} med Vipps",

  "about.builtBy": "Laget av",
  "about.services": "Se tjenestene mine →",
  "about.hire": "Ta kontakt",

  "license.title": "Lisens & fri bruk",
  "license.body":
    "{name} er kildeåpen under PolyForm Small Business-lisensen: gratis å bruke hvis selskapet ditt har under 100 personer og under 1M USD i omsetning. Større selskaper trenger en kommersiell lisens — ta kontakt. Uansett: donasjoner holder det i live. 🙏",
  "license.linkText": "PolyForm Small Business-lisensen",

  "login.title": "Logg inn",
  "login.continueVipps": "Fortsett med Vipps",
  "login.or": "eller",
  "login.devNote": "Dev-innlogging (uten passord) — for lokal utvikling og testing.",
  "login.name": "Navn",
  "login.email": "E-post",
  "login.signIn": "Logg inn",
  "login.noProviders":
    "Ingen innloggingsmetoder er konfigurert. Sett ENABLE_DEV_LOGIN=true eller legg til Vipps-nøkler.",

  "receipt.checking": "Sjekker betaling …",
  "receipt.confirming": "Vi bekrefter med Vipps.",
  "receipt.thanks": "Takk!",
  "receipt.donationThanks": "Tusen takk for donasjonen! 💜",
  "receipt.donationConfirmed":
    "Vipps har bekreftet betalingen. Alle donasjoner mottas med stor takknemlighet og bidrar til videre utvikling.",
  "receipt.paidLine": "{desc} — {amount} kr.",
  "receipt.notCompleted": "Betalingen ble ikke fullført",
  "receipt.notFound": "Fant ikke betalingen.",
  "receipt.tryAgain": "Prøv igjen",
  "receipt.back": "Til appen →",

  "subreceipt.awaiting": "Venter på godkjenning …",
  "subreceipt.approve": "Godkjenn avtalen i Vipps-appen.",
  "subreceipt.active": "Avtalen er aktiv!",
  "subreceipt.donationThanks": "Tusen takk for den faste støtten! 💜",
  "subreceipt.donationConfirmed":
    "Vipps har bekreftet avtalen. Du kan når som helst se eller stoppe den på Min side.",
  "subreceipt.activeLine": "{desc} — {amount} kr {per}.",
  "subreceipt.notCreated": "Avtalen ble ikke opprettet",
  "subreceipt.notFound": "Fant ikke avtalen.",

  "profile.title": "Profil",
  "profile.notifications": "Varsler",
  "profile.markAllRead": "Merk alle som lest",
  "profile.none": "Ingen varsler.",
  "profile.signOut": "Logg ut",
  "profile.signInToView": "Logg inn for å se profilen din.",

  "billing.notConfigured":
    "💳 Vipps-betaling aktiveres når organisasjonen har lagt inn betalings-API-nøklene og koblet til sitt MSN.",
  "billing.once": "Engang",
  "billing.subscription": "Abonnement",
  "billing.payment": "Betaling",
  "billing.donation": "Donasjon",
  "billing.howOften": "Hvor ofte?",
  "billing.amount": "Beløp (kr)",
  "billing.amountPer": "Beløp per trekk (kr)",
  "billing.pay": "Betal {amount} kr med Vipps",
  "billing.startSub": "Start abonnement · {amount} kr {per}",
  "billing.opening": "Åpner Vipps …",
  "billing.mySubs": "Mine abonnement",
  "billing.cancel": "Si opp abonnement",
  "billing.cancelling": "Sier opp …",
  "billing.confirmCancel":
    "Si opp dette abonnementet? Du blir ikke trukket igjen.",
  "billing.history": "Betalingshistorikk",
  "billing.next": "neste",

  "settings.title": "Innstillinger",
  "settings.requiresAdmin": "Krever admin-tilgang.",
  "settings.org": "Organisasjon",
  "settings.orgName": "Organisasjonsnavn",
  "settings.msn": "Vipps MSN (kun tall)",
  "settings.save": "Lagre",
  "settings.vippsConnection": "Vipps-tilkobling",
  "settings.platformMissing":
    "Plattformen mangler Vipps-nøkler (settes av operatøren).",
  "settings.enterMsn": "Legg inn MSN over og lagre, koble så til.",
  "settings.connected": "Tilkoblet · MSN {msn}",
  "settings.disconnect": "Koble fra",
  "settings.msnSaved":
    "MSN {msn} lagret. Koble til for å registrere webhook og aktivere betaling for denne organisasjonen.",
  "settings.connect": "Koble til Vipps",
  "settings.connecting": "Kobler til …",
  "settings.addMember": "Legg til medlem",
  "settings.add": "Legg til",
  "settings.remove": "fjern",

  "admin.requiresAdmin": "Krever admin-tilgang.",
  "admin.disabled":
    "Admin-konsollen for betaling er avslått. Slå den på med FEATURE_PAYMENT_ADMIN=true for å håndtere refusjoner, reservasjoner og abonnement.",
  "admin.tab.overview": "Oversikt",
  "admin.tab.payments": "Betalinger",
  "admin.tab.subscriptions": "Abonnement",
  "admin.kpi.net": "Netto omsetning",
  "admin.kpi.captured": "Trukket",
  "admin.kpi.refunded": "Refundert",
  "admin.kpi.reserved": "Reservert",
  "admin.kpi.paid": "Betalinger",
  "admin.kpi.activeSubs": "Aktive abonnement",
  "admin.capture": "Trekk",
  "admin.cancelReserve": "Kanseller reservasjon",
  "admin.refund": "Refunder",
  "admin.noActions": "Ingen handlinger tilgjengelig.",
  "admin.captured": "Trukket",
  "admin.refunded": "Refundert",
  "admin.noPayments": "Ingen betalinger ennå.",
  "admin.stopSub": "Stopp abonnement",
  "admin.stopping": "Stopper …",
  "admin.charges": "Trekk",
  "admin.noCharges": "Ingen trekk ennå.",
  "admin.noSubs": "Ingen abonnement ennå.",
  "admin.max": "maks {n} kr",


  "status.pending": "Venter",
  "status.reserved": "Reservert",
  "status.paid": "Betalt",
  "status.cancelled": "Avbrutt",
  "status.failed": "Feilet",
  "status.refunded": "Refundert",
  "astatus.pending": "Venter på godkjenning",
  "astatus.active": "Aktiv",
  "astatus.stopped": "Sagt opp",
  "astatus.expired": "Utløpt",
  "reason.missingKeys": "Vipps-nøkler mangler.",
  "reason.missingMsn": "Organisasjonen mangler Vipps MSN.",
  "reason.agreementInactive":
    "Vipps-betalingsavtalen er ikke aktivert for dette nøkkelsettet.",
  "reason.unreachable": "Vipps kunne ikke bekrefte betalings-API-et akkurat nå.",
  "interval.month": "Månedlig",
  "interval.year": "Årlig",
  "per.mo": "/ mnd",
  "per.yr": "/ år",
  "purpose.one_time": "Engang",
  "purpose.subscription": "Abonnement",
  "purpose.donation": "Donasjon",
};

const en: Dict = {
  "nav.home": "Home",
  "nav.settings": "Settings",
  "nav.signIn": "Sign in",



  "donate.title": "Support the project 💜",
  "donate.sub":
    "If {name} saves you time, chip in what you can. Every krone helps keep it maintained.",
  "donate.once": "One-off",
  "donate.recurring": "Monthly / yearly",
  "donate.signInRecurring": "Sign in with Vipps to set up recurring support",
  "donate.opening": "Opening Vipps …",
  "donate.donate": "Donate {amount} kr with Vipps",
  "donate.support": "Support {amount} kr {per} with Vipps",

  "about.builtBy": "Built by",
  "about.services": "See my services →",
  "about.hire": "Hire me",

  "license.title": "License & fair use",
  "license.body":
    "{name} is source-available under the PolyForm Small Business License: free to use if your company has fewer than 100 people and under $1M revenue. Larger companies need a commercial license — get in touch. Either way, donations keep it alive. 🙏",
  "license.linkText": "PolyForm Small Business License",

  "login.title": "Sign in",
  "login.continueVipps": "Continue with Vipps",
  "login.or": "or",
  "login.devNote": "Dev login (no password) — for local development and testing.",
  "login.name": "Name",
  "login.email": "Email",
  "login.signIn": "Sign in",
  "login.noProviders":
    "No login providers configured. Set ENABLE_DEV_LOGIN=true or add Vipps keys.",

  "receipt.checking": "Checking payment …",
  "receipt.confirming": "Confirming with Vipps.",
  "receipt.thanks": "Thanks!",
  "receipt.donationThanks": "Thank you so much for the donation! 💜",
  "receipt.donationConfirmed":
    "Vipps has confirmed the payment. Every donation is deeply appreciated and supports continued development.",
  "receipt.paidLine": "{desc} — {amount} kr.",
  "receipt.notCompleted": "Payment not completed",
  "receipt.notFound": "Payment not found.",
  "receipt.tryAgain": "Try again",
  "receipt.back": "Back to app →",

  "subreceipt.awaiting": "Awaiting approval …",
  "subreceipt.approve": "Approve the subscription in the Vipps app.",
  "subreceipt.active": "Subscription active!",
  "subreceipt.donationThanks": "Thank you for the recurring support! 💜",
  "subreceipt.donationConfirmed":
    "Vipps has confirmed the agreement. You can view or stop it on My page at any time.",
  "subreceipt.activeLine": "{desc} — {amount} kr {per}.",
  "subreceipt.notCreated": "Subscription not created",
  "subreceipt.notFound": "Not found.",

  "profile.title": "Profile",
  "profile.notifications": "Notifications",
  "profile.markAllRead": "Mark all read",
  "profile.none": "No notifications.",
  "profile.signOut": "Sign out",
  "profile.signInToView": "Sign in to view your profile.",

  "billing.notConfigured":
    "💳 Vipps payments activate once the organization has entered its payment API keys and connected its MSN.",
  "billing.once": "One-time",
  "billing.subscription": "Subscription",
  "billing.payment": "Payment",
  "billing.donation": "Donation",
  "billing.howOften": "How often?",
  "billing.amount": "Amount (kr)",
  "billing.amountPer": "Amount per charge (kr)",
  "billing.pay": "Pay {amount} kr with Vipps",
  "billing.startSub": "Start subscription · {amount} kr {per}",
  "billing.opening": "Opening Vipps …",
  "billing.mySubs": "My subscriptions",
  "billing.cancel": "Cancel subscription",
  "billing.cancelling": "Cancelling …",
  "billing.confirmCancel": "Cancel this subscription? You won't be charged again.",
  "billing.history": "Payment history",
  "billing.next": "next",

  "settings.title": "Settings",
  "settings.requiresAdmin": "Requires admin access.",
  "settings.org": "Organization",
  "settings.orgName": "Organization name",
  "settings.msn": "Vipps MSN (digits only)",
  "settings.save": "Save",
  "settings.vippsConnection": "Vipps connection",
  "settings.platformMissing": "Platform is missing Vipps keys (set by the operator).",
  "settings.enterMsn": "Enter the MSN above and save, then connect.",
  "settings.connected": "Connected · MSN {msn}",
  "settings.disconnect": "Disconnect",
  "settings.msnSaved":
    "MSN {msn} saved. Connect to register the webhook and activate payments for this organization.",
  "settings.connect": "Connect to Vipps",
  "settings.connecting": "Connecting …",
  "settings.addMember": "Add member",
  "settings.add": "Add",
  "settings.remove": "remove",

  "admin.requiresAdmin": "Requires admin access.",
  "admin.disabled":
    "The billing admin console is disabled. Enable it with FEATURE_PAYMENT_ADMIN=true to manage refunds, reserves and subscriptions.",
  "admin.tab.overview": "Overview",
  "admin.tab.payments": "Payments",
  "admin.tab.subscriptions": "Subscriptions",
  "admin.kpi.net": "Net revenue",
  "admin.kpi.captured": "Captured",
  "admin.kpi.refunded": "Refunded",
  "admin.kpi.reserved": "Reserved",
  "admin.kpi.paid": "Payments",
  "admin.kpi.activeSubs": "Active subscriptions",
  "admin.capture": "Capture",
  "admin.cancelReserve": "Cancel reserve",
  "admin.refund": "Refund",
  "admin.noActions": "No actions available.",
  "admin.captured": "Captured",
  "admin.refunded": "Refunded",
  "admin.noPayments": "No payments yet.",
  "admin.stopSub": "Stop subscription",
  "admin.stopping": "Stopping …",
  "admin.charges": "Charges",
  "admin.noCharges": "No charges yet.",
  "admin.noSubs": "No subscriptions yet.",
  "admin.max": "max {n} kr",


  "status.pending": "Pending",
  "status.reserved": "Reserved",
  "status.paid": "Paid",
  "status.cancelled": "Cancelled",
  "status.failed": "Failed",
  "status.refunded": "Refunded",
  "astatus.pending": "Awaiting approval",
  "astatus.active": "Active",
  "astatus.stopped": "Stopped",
  "astatus.expired": "Expired",
  "reason.missingKeys": "Vipps keys are missing.",
  "reason.missingMsn": "This organization has no Vipps MSN.",
  "reason.agreementInactive":
    "The Vipps payment agreement is not active for this key set.",
  "reason.unreachable": "Vipps could not confirm the payment API right now.",
  "interval.month": "Monthly",
  "interval.year": "Yearly",
  "per.mo": "/ mo",
  "per.yr": "/ yr",
  "purpose.one_time": "One-time",
  "purpose.subscription": "Subscription",
  "purpose.donation": "Donation",
};

export const dictionaries: Record<Locale, Dict> = { no, en };

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function translator(locale: Locale): TranslateFn {
  const d = dictionaries[locale];
  return (key, vars) => {
    let s = d[key] ?? dictionaries.no[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}
