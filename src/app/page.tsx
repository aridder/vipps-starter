import Link from "next/link";
import { cookies } from "next/headers";
import { resolveSite } from "@/lib/site";
import { resolveLocale, translator } from "@/lib/i18n";
import { DonateWidget } from "@/components/DonateWidget";
import { RealPaymentNotice } from "@/components/RealPaymentNotice";
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
      name: "Order Management",
      body: no
        ? "Rike kvitteringer og ordrelinjer legges direkte i Vipps-aktiviteten for hver engangsbetaling."
        : "Rich receipts and order lines are added directly to Vipps activity for every one-off payment.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/order-management-api/",
    },
    {
      name: "QR",
      body: no
        ? "Vipps-generert betalings-QR med fysisk kundetilstedeværelse og live, autoritativ statussjekk."
        : "Vipps-generated payment QR with customer-present semantics and live, authoritative status checks.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/epayment-api/how-it-works/qr/",
    },
    {
      name: "Report API",
      body: no
        ? "Datobasert avstemming av funds og fees i den rollebeskyttede driftssentralen."
        : "Date-based reconciliation of funds and fees in the role-protected operations console.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/report-api/",
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
      priority: no ? "Klar til aktivering" : "Ready to activate",
      name: "ePayment Express",
      body: no
        ? "Hele flyten er bygget med serverstyrt vare, samtykke, adresse og fast frakt. Slås på først når et ekte produkt og levering er konfigurert."
        : "The full flow is built with a server-controlled product, consent, address and fixed shipping. It is enabled only after a real product and fulfilment are configured.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/epayment-api/api-guide/features/express/",
    },
    {
      priority: no ? "Eksperimentell adapter" : "Experimental adapter",
      name: "Agentic Commerce (UCP)",
      body: no
        ? "En isolert Payment Handler-kontrakt er klar for AI- og samtaleflyter. Ingen produksjonskall før Vipps stabiliserer API-et."
        : "An isolated Payment Handler contract is ready for AI and conversational flows. No production calls until Vipps stabilizes the API.",
      href: "https://developer.vippsmobilepay.com/docs/APIs/agentic-commerce/",
    },
  ];

  return (
    <div className="space-y-24 pb-8">
      <div className="space-y-4">
        <RealPaymentNotice recipientName={site.author.name} />

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
      </div>

      <RoleJourney locale={locale} />

      <section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
              {no ? "Produktportefølje" : "Product portfolio"}
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {no
                ? "Det som er bygget nå – og det som venter på aktivering."
                : "What is built now – and what awaits activation."}
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
                  {product.name === "Vipps Login"
                    ? no
                      ? "Live nå"
                      : "Live now"
                    : no
                      ? "Bygget"
                      : "Built"}
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

      <DonateWidget
        siteName={site.name}
        recipientName={site.author.name}
      />

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

    </div>
  );
}
