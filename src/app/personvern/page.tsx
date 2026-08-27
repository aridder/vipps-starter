import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { resolveSite } from "@/lib/site";
import { resolveLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const site = resolveSite();
  return { title: `Personvern – ${site.name}` };
}

export default async function PrivacyPage() {
  const site = resolveSite();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value);
  const no = locale === "no";
  const updated = no ? "27. august 2026" : "27 August 2026";

  const sections: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: no ? "1. Behandlingsansvarlig" : "1. Data controller",
      body: no ? (
        <>
          {site.author.name} er behandlingsansvarlig for personopplysninger som
          samles inn på {site.name}. Kontakt:{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>
          .
        </>
      ) : (
        <>
          {site.author.name} is the data controller for personal data collected
          on {site.name}. Contact:{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>
          .
        </>
      ),
    },
    {
      title: no ? "2. Hvilke opplysninger vi behandler" : "2. What data we process",
      body: no
        ? "Når du logger inn med Vipps Login mottar vi navn, e-postadresse og telefonnummer fra Vipps, etter ditt samtykke i Vipps-appen. Når du betaler eller oppretter en fast avtale lagrer vi beløp, status, tidspunkt og Vipps-referansen for transaksjonen. Kort- og kontoinformasjon behandles utelukkende av Vipps MobilePay og når aldri våre systemer."
        : "When you sign in with Vipps Login we receive your name, email address and phone number from Vipps, after your consent in the Vipps app. When you pay or create a recurring agreement we store the amount, status, timestamp and the Vipps reference for the transaction. Card and account details are processed exclusively by Vipps MobilePay and never reach our systems.",
    },
    {
      title: no ? "3. Formål og rettslig grunnlag" : "3. Purpose and legal basis",
      body: no
        ? "Opplysningene brukes til å levere tjenesten: identifisere deg ved innlogging, gjennomføre og dokumentere betalinger, administrere faste avtaler og svare på henvendelser. Grunnlaget er avtalen med deg (GDPR art. 6-1 b) og rettslige forpliktelser som bokføring (art. 6-1 c)."
        : "The data is used to deliver the service: identifying you at sign-in, completing and documenting payments, managing recurring agreements and answering enquiries. The legal basis is our agreement with you (GDPR art. 6(1)(b)) and legal obligations such as bookkeeping (art. 6(1)(c)).",
    },
    {
      title: no ? "4. Informasjonskapsler og analyse" : "4. Cookies and analytics",
      body: no
        ? "Vi bruker kun nødvendige informasjonskapsler: en sesjonskapsel som holder deg innlogget og en kapsel (NEXT_LOCALE) som husker språkvalget ditt. Vi samler anonym bruksstatistikk (sidevisninger og ytelse) med tilfeldige identifikatorer i din egen nettleser; statistikken lagres hos oss og deles ikke med annonse- eller sporingstjenester."
        : "We only use necessary cookies: a session cookie that keeps you signed in and a cookie (NEXT_LOCALE) that remembers your language choice. We collect anonymous usage statistics (page views and performance) using random identifiers kept in your own browser; the statistics are stored by us and are not shared with advertising or tracking services.",
    },
    {
      title: no ? "5. Deling og lagring" : "5. Sharing and storage",
      body: no
        ? "Opplysningene deles ikke med andre enn Vipps MobilePay (for å gjennomføre betalinger) og vår driftsleverandør som lagrer databasen. Vi selger aldri personopplysninger. Opplysningene lagres så lenge du har en konto eller så lenge bokføringsregler krever det, og slettes deretter."
        : "Data is not shared with anyone except Vipps MobilePay (to process payments) and our hosting provider that stores the database. We never sell personal data. Data is kept for as long as you have an account or as long as bookkeeping rules require, and is then deleted.",
    },
    {
      title: no ? "6. Dine rettigheter" : "6. Your rights",
      body: no ? (
        <>
          Du har rett til innsyn, retting og sletting av opplysningene dine, og
          til å protestere mot eller begrense behandlingen. Send en e-post til{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>
          , så svarer vi innen 30 dager. Du kan også klage til Datatilsynet (
          <a
            href="https://www.datatilsynet.no"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            datatilsynet.no
          </a>
          ).
        </>
      ) : (
        <>
          You have the right to access, correct and delete your data, and to
          object to or restrict the processing. Email{" "}
          <a href={`mailto:${site.author.email}`} className="underline">
            {site.author.email}
          </a>{" "}
          and we will respond within 30 days. You may also complain to the
          Norwegian Data Protection Authority (
          <a
            href="https://www.datatilsynet.no"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            datatilsynet.no
          </a>
          ).
        </>
      ),
    },
    {
      title: no ? "7. Endringer" : "7. Changes",
      body: no
        ? "Vi kan oppdatere denne erklæringen. Datoen øverst viser når den sist ble endret."
        : "We may update this policy. The date at the top shows when it was last changed.",
    },
  ];

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        {no ? "Personvernerklæring" : "Privacy policy"}
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
            <Link href="/vilkar" className="underline">
              brukervilkårene
            </Link>
            .
          </>
        ) : (
          <>
            See also the{" "}
            <Link href="/vilkar" className="underline">
              terms of use
            </Link>
            .
          </>
        )}
      </p>
    </article>
  );
}
