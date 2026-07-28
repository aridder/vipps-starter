import Link from "next/link";
import { cookies } from "next/headers";
import { resolveSite } from "@/lib/site";
import { resolveLocale, translator } from "@/lib/i18n";
import { DonateWidget } from "@/components/DonateWidget";
import { RoleJourney } from "@/components/RoleJourney";

export default async function LandingPage() {
  const site = resolveSite();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value);
  const t = translator(locale);
  const no = locale === "no";

  const liveProducts = [
    {
      name: "Vipps Login",
      body: no
        ? "Passordfri innlogging med verifisert kundeprofil og tydelig samtykke."
        : "Passwordless sign-in with a verified customer profile and clear consent.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/login-api/",
    },
    {
      name: "ePayment",
      body: no
        ? "Engangsbetaling, reservasjon, trekk, kansellering og hel eller delvis refusjon."
        : "One-off payment, reserve, capture, cancellation and full or partial refunds.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/epayment-api/",
    },
    {
      name: "Recurring",
      body: no
        ? "Månedlige og årlige avtaler med automatiske trekk, retry og oppsigelse."
        : "Monthly and yearly agreements with automatic charges, retries and cancellation.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/recurring-api/",
    },
    {
      name: no ? "Signerte webhooks" : "Signed webhooks",
      body: no
        ? "Hendelser valideres med HMAC, mens API-oppslag bekrefter autoritativ status."
        : "Events are validated with HMAC while API lookups confirm authoritative status.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/",
    },
  ];

  const nextProducts = [
    {
      priority: no ? "Neste" : "Next",
      name: "Order Management",
      body: no
        ? "Kvittering, ordrelinjer og lenker direkte i Vipps-aktiviteten. Størst umiddelbar gevinst for kundeopplevelsen."
        : "Receipts, order lines and links directly in Vipps activity. The largest immediate customer-experience gain.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/order-management-api/",
    },
    {
      priority: no ? "Deretter" : "Then",
      name: "QR",
      body: no
        ? "Dynamisk QR for betaling på skjerm eller fysisk flate – en god demo av Vipps utenfor nettbutikken."
        : "Dynamic QR payments on screens or physical surfaces – a strong demo beyond web checkout.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/qr-api/",
    },
    {
      priority: no ? "For nettbutikk" : "For commerce",
      name: "ePayment Express",
      body: no
        ? "Adresse, profil og fraktvalg godkjennes i Vipps. Relevant når starteren skal demonstrere en komplett varehandel."
        : "Address, profile and shipping are approved in Vipps. Relevant when the starter demonstrates complete commerce.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/epayment-api/how-it-works/express/",
    },
    {
      priority: no ? "For drift" : "For operations",
      name: "Report API",
      body: no
        ? "Oppgjør, gebyrer og utbetalinger for avstemming. Mest verdi for administrator og økonomi."
        : "Settlements, fees and payouts for reconciliation. Most valuable for administrators and finance.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/report-api/",
    },
    {
      priority: no ? "Følg med" : "Watch",
      name: "Agentic Commerce (UCP)",
      body: no
        ? "Vipps-betaling i AI- og samtaleflyter. Svært relevant for målgruppen, men dokumentasjonen er fortsatt under utvikling."
        : "Vipps payments in AI and conversational flows. Highly relevant to the audience, but the documentation is still under development.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/agentic-commerce/",
    },
  ];

  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-stone-950 px-6 py-12 text-white shadow-[0_32px_100px_-48px_rgba(28,25,23,0.8)] sm:px-12 sm:py-16">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#ff5b24] opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-600 opacity-20 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            {no ? "Produksjonsklar Vipps-portefølje" : "Production-ready Vipps portfolio"}
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.03] tracking-[-0.04em] sm:text-6xl">
            {no ? (
              <>
                Hele Vipps-reisen.
                <br />
                <span className="text-[#ff7a4d]">Ferdig bygget.</span>
              </>
            ) : (
              <>
                The complete Vipps journey.
                <br />
                <span className="text-[#ff7a4d]">Ready to build on.</span>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
            {no
              ? "En åpen referanseapp som viser hva kunden opplever og hva administratoren faktisk kan gjøre – fra Vipps Login til betaling, faste trekk og refusjon."
              : "An open reference app that shows what the customer experiences and what the administrator can actually do – from Vipps Login to payments, recurring charges and refunds."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#journeys"
              className="inline-flex items-center justify-center rounded-2xl bg-[#ff5b24] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_35px_-14px_rgba(255,91,36,0.9)] transition hover:-translate-y-0.5 hover:bg-[#ff6a38]"
            >
              {no ? "Se kundereisen" : "See the customer journey"} →
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              {no ? "Utforsk som administrator" : "Explore as administrator"}
            </Link>
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold text-stone-300 transition hover:text-white"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        <div className="relative mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {[
            [no ? "Kunde" : "Customer", no ? "Logg inn · betal · følg opp" : "Sign in · pay · follow up"],
            [no ? "Administrator" : "Administrator", no ? "Trekk · refunder · avstem" : "Capture · refund · reconcile"],
            [no ? "Sikkerhet" : "Security", no ? "HMAC + autoritativ status" : "HMAC + authoritative status"],
          ].map(([label, body]) => (
            <div key={label} className="bg-stone-950/70 px-5 py-4 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {label}
              </div>
              <div className="mt-1 text-sm font-semibold text-stone-200">{body}</div>
            </div>
          ))}
        </div>
      </section>

      <RoleJourney locale={locale} />

      <section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
              {no ? "Produktportefølje" : "Product portfolio"}
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {no ? "Det som virker nå – og det vi bør bygge neste." : "What works now – and what to build next."}
            </h2>
          </div>
          <p className="text-sm leading-6 text-stone-600 lg:pb-1">
            {no
              ? "Porteføljen prioriterer komplette brukerreiser fremfor flest mulig API-logoer. Hver modul skal være forståelig, testbar og nyttig både for kunde og administrator."
              : "The portfolio prioritizes complete user journeys over collecting API logos. Every module should be understandable, testable and useful to both customer and administrator."}
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {liveProducts.map((product) => (
            <a
              key={product.name}
              href={product.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-3xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                  {no ? "Live nå" : "Live now"}
                </span>
                <span className="text-stone-300 transition group-hover:text-stone-600">↗</span>
              </div>
              <h3 className="mt-4 text-lg font-black">{product.name}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{product.body}</p>
            </a>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {nextProducts.map((product) => (
            <a
              key={product.name}
              href={product.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5 transition hover:border-indigo-300 hover:bg-white"
            >
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                {product.priority}
              </span>
              <h3 className="mt-3 font-black">
                {product.name} <span className="text-stone-300 group-hover:text-indigo-500">↗</span>
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{product.body}</p>
            </a>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <DonateWidget siteName={site.name} />
        <section className="rounded-[2rem] bg-indigo-700 p-6 text-white sm:p-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">
            {no ? "Slik er det sikret" : "How it is secured"}
          </div>
          <h2 className="mt-3 text-2xl font-black">
            {no ? "En webhook er et varsel – ikke en fasit." : "A webhook is a signal – not the source of truth."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-indigo-100">
            {no
              ? "Alle webhooks signaturvalideres. Deretter henter serveren betalingsstatus direkte fra Vipps før lokal status oppdateres. Det gir en robust flyt også ved forsinkede eller dupliserte hendelser."
              : "Every webhook is signature validated. The server then fetches payment status directly from Vipps before updating local state, keeping the flow robust across delayed or duplicate events."}
          </p>
          <div className="mt-6 space-y-3 text-sm">
            {[
              no ? "✓ HMAC-signatur håndheves" : "✓ HMAC signature enforced",
              no ? "✓ Idempotente betalingsoperasjoner" : "✓ Idempotent payment operations",
              no ? "✓ Rollebeskyttede adminhandlinger" : "✓ Role-protected admin actions",
              no ? "✓ Ingen kortdata lagres i appen" : "✓ No card data stored in the app",
            ].map((item) => (
              <div key={item} className="rounded-xl bg-white/10 px-3 py-2.5 font-semibold">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid overflow-hidden rounded-[2rem] bg-stone-900 text-stone-100 md:grid-cols-[1.2fr_0.8fr]">
        <div className="p-6 sm:p-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            {t("about.builtBy")}
          </div>
          <h2 className="mt-2 text-2xl font-black">{site.author.name}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300">
            {site.author.tagline}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={site.author.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-stone-900"
            >
              {t("about.services")}
            </a>
            <a
              href={`mailto:${site.author.email}`}
              className="rounded-xl border border-stone-600 px-4 py-2.5 text-sm font-bold hover:bg-stone-800"
            >
              {t("about.hire")}
            </a>
          </div>
        </div>
        <div className="border-t border-stone-700 bg-stone-800 p-6 text-sm md:border-l md:border-t-0 sm:p-8">
          <h3 className="font-bold">{t("license.title")}</h3>
          <p className="mt-2 leading-6 text-stone-400">
            {t("license.body", { name: site.name })}
          </p>
          <a
            href="https://polyformproject.org/licenses/small-business/1.0.0"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block font-bold text-white underline decoration-stone-600 underline-offset-4"
          >
            {t("license.linkText")} ↗
          </a>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-stone-200 pt-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
        <span>© {site.author.name}</span>
        <span>
          <a href={site.githubUrl} target="_blank" rel="noreferrer" className="underline">
            GitHub
          </a>{" "}
          ·{" "}
          <a href={site.author.url} target="_blank" rel="noreferrer" className="underline">
            LinkedIn
          </a>
        </span>
      </footer>
    </div>
  );
}
