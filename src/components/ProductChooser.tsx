import type { Locale } from "@/lib/i18n";

/**
 * "Which Vipps product do I actually need?" is the question people google
 * before they write any code, and there is no good Norwegian answer to it
 * anywhere. Facts here are from developer.vippsmobilepay.com, checked
 * 2026-08-28 — see FACTS_CHECKED below and keep it honest when editing.
 */
const FACTS_CHECKED = "28.08.2026";

type Row = {
  product: string;
  when: Record<Locale, string>;
  built: "yes" | "flag" | "no";
  note: Record<Locale, string>;
  docs: string;
};

const ROWS: Row[] = [
  {
    product: "ePayment",
    when: {
      no: "Standardvalget. Kunden betaler på nettsiden din — digitalt produkt, donasjon, eller en vare du allerede har adressen til.",
      en: "The default. The customer pays on your site — a digital product, a donation, or goods you already have the address for.",
    },
    built: "yes",
    note: {
      no: "Brukt av donasjonsknappen på denne siden.",
      en: "Used by the donation button on this page.",
    },
    docs: "https://developer.vippsmobilepay.com/docs/APIs/epayment-api/",
  },
  {
    product: "ePayment Express",
    when: {
      no: "Fysisk vare der du trenger adresse og fraktvalg. Kunden velger frakt inne i Vipps-appen, og du får adressen tilbake på et callback.",
      en: "Physical goods where you need an address and a shipping choice. The customer picks shipping inside the Vipps app and you get the address back on a callback.",
    },
    built: "flag",
    note: {
      no: "Bygget, men av som standard til et ekte produkt og levering er satt opp.",
      en: "Built, but off by default until a real product and fulfilment are configured.",
    },
    docs: "https://developer.vippsmobilepay.com/docs/recommended-flows/online/",
  },
  {
    product: "Recurring",
    when: {
      no: "Abonnement, medlemskap eller fast støtte. Kunden godkjenner én avtale, og du trekker på den senere uten at kunden må gjøre noe.",
      en: "Subscriptions, memberships or regular support. The customer approves one agreement and you charge against it later without them lifting a finger.",
    },
    built: "yes",
    note: {
      no: "Avtale + trekk, med en daglig kjøring som lager trekket før forfall.",
      en: "Agreement plus charges, with a daily run that creates the charge before it falls due.",
    },
    docs: "https://developer.vippsmobilepay.com/docs/APIs/recurring-api/",
  },
  {
    product: "QR",
    when: {
      no: "Kunden er fysisk til stede — kasse, bord, plakat, automat. Skanning åpner betalingen i appen.",
      en: "The customer is physically present — a till, a table, a poster, a vending machine. Scanning opens the payment in the app.",
    },
    built: "yes",
    note: {
      no: "Her løst som ePayment med userFlow QR, ikke som eget QR-API.",
      en: "Implemented here as ePayment with userFlow QR, not as the separate QR API.",
    },
    docs: "https://developer.vippsmobilepay.com/docs/APIs/qr-api/",
  },
  {
    product: "Login",
    when: {
      no: "Du vil vite hvem kunden er — verifisert navn, e-post og telefon — uten å bygge passord og glemt-passord selv.",
      en: "You want to know who the customer is — verified name, email and phone — without building passwords and reset flows yourself.",
    },
    built: "yes",
    note: {
      no: "Bestilles som eget produkt hos Vipps, i tillegg til betaling.",
      en: "Ordered as its own product from Vipps, in addition to payments.",
    },
    docs: "https://developer.vippsmobilepay.com/docs/APIs/login-api/",
  },
  {
    product: "Checkout",
    when: {
      no: "Var den ferdigpakkede løsningen som samlet innlogging, betaling og frakt i én økt.",
      en: "Used to be the packaged option bundling sign-in, payment and shipping into one session.",
    },
    built: "no",
    note: {
      no: "Vipps har merket Checkout som legacy og selger løsningen til Kustom. Derfor bygger dette repoet på ePayment direkte.",
      en: "Vipps has marked Checkout as legacy and is selling the solution to Kustom. That is why this repository builds on ePayment directly.",
    },
    docs: "https://developer.vippsmobilepay.com/docs/APIs/checkout-api/",
  },
];

const copy = {
  no: {
    eyebrow: "Hvilket produkt trenger du?",
    title: "ePayment, Express, Recurring eller QR?",
    lead: "Det er stort sett ett spørsmål som avgjør: hva slags kjøp er det? Under er kriteriene, og hva som er bygget her.",
    colProduct: "Produkt",
    colWhen: "Velg denne når",
    colBuilt: "I dette repoet",
    yes: "Bygget",
    flag: "Bak et flagg",
    no: "Ikke bygget",
    docs: "Vipps-docs",
    checked: `Fakta hentet fra Vipps' egen dokumentasjon ${FACTS_CHECKED}.`,
  },
  en: {
    eyebrow: "Which product do you need?",
    title: "ePayment, Express, Recurring or QR?",
    lead: "One question mostly settles it: what kind of purchase is this? Here are the criteria, and what is built here.",
    colProduct: "Product",
    colWhen: "Choose this when",
    colBuilt: "In this repo",
    yes: "Built",
    flag: "Behind a flag",
    no: "Not built",
    docs: "Vipps docs",
    checked: `Facts taken from Vipps' own documentation on ${FACTS_CHECKED}.`,
  },
} satisfies Record<Locale, Record<string, string>>;

export function ProductChooser({ locale }: { locale: Locale }) {
  const c = copy[locale];

  return (
    <section id="velg-produkt" className="scroll-mt-8">
      <div className="max-w-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
          {c.eyebrow}
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{c.lead}</p>
      </div>

      <div className="mt-8 overflow-x-auto rounded-[2rem] border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-stone-200 text-xs font-black uppercase tracking-wider text-stone-500">
              <th scope="col" className="px-5 py-4">
                {c.colProduct}
              </th>
              <th scope="col" className="px-5 py-4">
                {c.colWhen}
              </th>
              <th scope="col" className="px-5 py-4">
                {c.colBuilt}
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.product}
                className="border-b border-stone-100 align-top last:border-0"
              >
                <th scope="row" className="px-5 py-5 font-black">
                  {row.product}
                  <a
                    href={row.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-xs font-bold text-stone-400 underline-offset-4 hover:text-stone-700 hover:underline"
                  >
                    {c.docs} ↗
                  </a>
                </th>
                <td className="px-5 py-5 text-sm leading-6 text-stone-600">
                  {row.when[locale]}
                </td>
                <td className="px-5 py-5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                      row.built === "yes"
                        ? "bg-emerald-100 text-emerald-700"
                        : row.built === "flag"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {row.built === "yes"
                      ? c.yes
                      : row.built === "flag"
                        ? c.flag
                        : c.no}
                  </span>
                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    {row.note[locale]}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-400">{c.checked}</p>
    </section>
  );
}
