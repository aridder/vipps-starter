import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { legalUpdated, resolveSite } from "@/lib/site";
import { resolveLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const site = resolveSite();
  return { title: `Brukervilkår – ${site.name}` };
}

export default async function TermsPage() {
  const site = resolveSite();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value);
  const no = locale === "no";
  const updated = legalUpdated[locale];

  const sections: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: no ? "1. Om tjenesten" : "1. About the service",
      body: no ? (
        <>
          {site.name} drives av {site.author.name} (
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>
          ). Tjenesten er en åpen referanseapplikasjon som demonstrerer
          Vipps-integrasjon – innlogging, betaling, faste trekk og refusjon.
          Betalingene på siden er ekte donasjoner til utvikleren for å vise
          integrasjonen ende til ende.
        </>
      ) : (
        <>
          {site.name} is operated by {site.author.name} (
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>
          ). The service is an open reference application demonstrating Vipps
          integration – sign-in, payments, recurring charges and refunds.
          Payments on the site are real donations to the developer, made to
          show the integration end to end.
        </>
      ),
    },
    {
      title: no ? "2. Betaling" : "2. Payments",
      body: no
        ? "Alle betalinger gjennomføres med Vipps og belastes i norske kroner (NOK). Beløpet vises tydelig før du bekrefter i Vipps-appen, og du får kvittering i Vipps-aktiviteten din. Kort- og kontoinformasjon håndteres av Vipps MobilePay og lagres aldri hos oss."
        : "All payments are processed by Vipps and charged in Norwegian kroner (NOK). The amount is shown clearly before you confirm in the Vipps app, and a receipt appears in your Vipps activity. Card and account details are handled by Vipps MobilePay and are never stored by us.",
    },
    {
      title: no ? "3. Fast støtte (abonnement)" : "3. Recurring support (subscription)",
      body: no ? (
        <>
          Fast støtte settes opp som en betalingsavtale i Vipps og belastes
          månedlig eller årlig, slik det fremgår når du oppretter avtalen. Du
          kan når som helst si opp avtalen på{" "}
          <Link href="/billing" className="underline">
            betalingssiden
          </Link>{" "}
          her eller direkte i Vipps-appen. Oppsigelse stopper alle fremtidige
          trekk; allerede gjennomførte trekk refunderes ikke automatisk.
        </>
      ) : (
        <>
          Recurring support is set up as a payment agreement in Vipps and is
          charged monthly or yearly, as stated when you create the agreement.
          You can cancel at any time on the{" "}
          <Link href="/billing" className="underline">
            billing page
          </Link>{" "}
          here or directly in the Vipps app. Cancellation stops all future
          charges; charges already completed are not refunded automatically.
        </>
      ),
    },
    {
      title: no ? "4. Angrerett og refusjon" : "4. Right of withdrawal and refunds",
      body: no ? (
        <>
          Donasjoner er frivillige bidrag uten motytelse. Har du betalt ved en
          feil, eller ønsker du beløpet tilbake, ta kontakt på{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>{" "}
          – vi refunderer via Vipps så snart vi kan, normalt innen 14 dager.
        </>
      ) : (
        <>
          Donations are voluntary contributions with no goods or services in
          return. If you paid by mistake or want the amount back, contact{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>{" "}
          – we refund via Vipps as soon as we can, normally within 14 days.
        </>
      ),
    },
    {
      title: no ? "5. Konto og innlogging" : "5. Account and sign-in",
      body: no
        ? "Innlogging skjer med Vipps Login. Du er selv ansvarlig for at ingen andre får tilgang til Vipps-appen din. Vi kan stenge kontoer som misbruker tjenesten."
        : "Sign-in is handled by Vipps Login. You are responsible for keeping your own Vipps app secure. We may close accounts that abuse the service.",
    },
    {
      title: no ? "6. Ansvar" : "6. Liability",
      body: no
        ? "Tjenesten leveres «som den er», uten garanti for oppetid eller feilfrihet. Vårt ansvar er uansett begrenset til beløpet du har betalt gjennom tjenesten."
        : "The service is provided “as is”, with no guarantee of uptime or freedom from errors. Our liability is in any case limited to the amount you have paid through the service.",
    },
    {
      title: no ? "7. Endringer" : "7. Changes",
      body: no
        ? "Vi kan oppdatere disse vilkårene. Vesentlige endringer varsles på denne siden, og datoen øverst viser når vilkårene sist ble endret."
        : "We may update these terms. Material changes are announced on this page, and the date at the top shows when the terms were last changed.",
    },
    {
      title: no ? "8. Kontakt og lovvalg" : "8. Contact and governing law",
      body: no ? (
        <>
          Spørsmål om vilkårene rettes til{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>
          . Vilkårene er underlagt norsk rett.
        </>
      ) : (
        <>
          Questions about these terms go to{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>
          . These terms are governed by Norwegian law.
        </>
      ),
    },
  ];

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        {no ? "Brukervilkår" : "Terms of use"}
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        {no ? "Sist oppdatert" : "Last updated"}: {updated}
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{section.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-stone-500">
        {no ? (
          <>
            Se også{" "}
            <Link href="/personvern" className="underline">
              personvernerklæringen
            </Link>
            .
          </>
        ) : (
          <>
            See also the{" "}
            <Link href="/personvern" className="underline">
              privacy policy
            </Link>
            .
          </>
        )}
      </p>
    </article>
  );
}
