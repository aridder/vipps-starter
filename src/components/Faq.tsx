import type { Locale } from "@/lib/i18n";

/**
 * The questions people actually google before integrating Vipps. Everything
 * here is from Vipps' own documentation, checked on the date below — where the
 * docs were unclear (for example whether an enkeltpersonforetak qualifies) the
 * answer says so instead of guessing. Native <details> so it works without JS.
 */
const CHECKED = "28.08.2026";

type Item = { q: Record<Locale, string>; a: Record<Locale, React.ReactNode> };

const DOC = "https://developer.vippsmobilepay.com/docs";

const ITEMS: Item[] = [
  {
    q: {
      no: "Trenger jeg en Vipps-avtale bare for å teste?",
      en: "Do I need a Vipps agreement just to test?",
    },
    a: {
      no: (
        <>
          Ja. Et test-salgssted opprettes automatisk når bedriften bestiller et
          Vipps-produkt som inkluderer et API. Testnøklene er normalt klare
          noen minutter etter det, mens produksjonsnøkler tar noen dager. Du
          kan altså ikke laste ned dette repoet og teste mot Vipps helt uten
          en bedriftsrelasjon.
        </>
      ),
      en: (
        <>
          Yes. A test sales unit is created automatically when your business
          orders a Vipps product that includes an API. Test keys are usually
          ready minutes later; production keys take a few days. So you cannot
          clone this repository and test against Vipps with no business
          relationship at all.
        </>
      ),
    },
  },
  {
    q: {
      no: "Hva kreves for å komme i gang som bedrift?",
      en: "What does a business need to get started?",
    },
    a: {
      no: (
        <>
          Et registrert foretak med organisasjonsnummer i Norge, Danmark eller
          Finland, og en bedriftskonto i samme land. Vipps gjør
          kundekontroll (KYC), og avtalen signeres med elektronisk ID før du
          kan gå live. Selve go-live er en produktspesifikk sjekkliste, ikke en
          fritekstvurdering.{" "}
          <em>
            Dokumentasjonen sier ikke noe eksplisitt om enkeltpersonforetak —
            spør Vipps hvis det er din situasjon.
          </em>
        </>
      ),
      en: (
        <>
          A registered business with an organisation number in Norway, Denmark
          or Finland, and a business bank account in the same country. Vipps
          runs KYC checks, and the agreement is signed with electronic ID
          before you can go live. Go-live itself is a product-specific
          checklist, not a free-form review.{" "}
          <em>
            The documentation does not say anything explicit about sole
            proprietorships — ask Vipps if that is your situation.
          </em>
        </>
      ),
    },
  },
  {
    q: { no: "Hva koster Vipps?", en: "What does Vipps cost?" },
    a: {
      no: (
        <>
          Vipps publiserer standardpriser: integrert betaling og faste
          betalinger til 2,99 % + 1 kr per transaksjon, betalingslenker til
          2,49 % + 1 kr, donasjoner til 1,99 % + 1 kr, og Login fra 300 kr per
          måned. Vipps presiserer selv at dette er standard virksomhetsnivå, og
          at andre nivåer kan være tilgjengelige på forespørsel eller via
          partner — så sjekk{" "}
          <a
            href="https://vippsmobilepay.com/nb-NO/pricing"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            prissiden
          </a>{" "}
          før du regner på det. Tallene her er hentet {CHECKED}.
        </>
      ),
      en: (
        <>
          Vipps publishes standard prices: integrated payments and recurring at
          2.99% + 1 NOK per transaction, payment links at 2.49% + 1 NOK,
          donations at 1.99% + 1 NOK, and Login from 300 NOK per month. Vipps
          notes these reflect the standard business tier and that other tiers
          may be available on request or through a partner — so check the{" "}
          <a
            href="https://vippsmobilepay.com/nb-NO/pricing"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            pricing page
          </a>{" "}
          before budgeting. These figures were checked on {CHECKED}.
        </>
      ),
    },
  },
  {
    q: {
      no: "Hvordan skiller testmiljøet seg fra produksjon?",
      en: "How does the test environment differ from production?",
    },
    a: {
      no: (
        <>
          Test kjører mot <code className="font-mono">apitest.vipps.no</code>{" "}
          med egne nøkler og en egen test-app (MT-appen). Testbrukere har
          telefonnummer, fødselsnummer og et forhåndsregistrert kort, og er
          ikke knyttet til ett bestemt salgssted. Tre ting finnes ikke i test:
          oppgjør (og dermed ingen oppgjørsrapporter), partner-nøkler, og
          pålitelige push-varsler.
        </>
      ),
      en: (
        <>
          Test runs against <code className="font-mono">apitest.vipps.no</code>{" "}
          with its own keys and its own test app (the MT app). Test users have
          a phone number, national identity number and a pre-registered card,
          and are not tied to one sales unit. Three things do not exist in
          test: settlements (so no settlement reports), partner keys, and
          reliable push notifications.
        </>
      ),
    },
  },
  {
    q: {
      no: "Hva er MSN, og hva er «partner»-modellen?",
      en: "What is an MSN, and what is the partner model?",
    },
    a: {
      no: (
        <>
          Et MSN (Merchant Serial Number) identifiserer et <em>salgssted</em> —
          ikke en bedrift. Én bedrift kan ha flere salgssteder, hvert med egen
          konto og egne nøkler. En partner er en plattform som handler på vegne
          av flere bedrifter: med partner-nøkler bruker du ett nøkkelsett på
          tvers, og angir hvilket salgssted hver forespørsel gjelder.{" "}
          <strong>Pengene går aldri via plattformen</strong> — hver bedrift er
          selv Vipps-kunde med eget organisasjonsnummer og eget oppgjør.{" "}
          <em>
            «Super-merchant» er ikke Vipps’ eget begrep; det er lånt vokabular
            fra andre betalingsplattformer.
          </em>
        </>
      ),
      en: (
        <>
          An MSN (Merchant Serial Number) identifies a <em>sales unit</em>, not
          a business. One business can have several sales units, each with its
          own account and keys. A partner is a platform acting on behalf of
          several businesses: with partner keys you use one key set across them
          and state which sales unit each request is for.{" "}
          <strong>Money never flows through the platform</strong> — every
          business is a Vipps customer in its own right, with its own
          organisation number and settlement.{" "}
          <em>
            “Super-merchant” is not Vipps’ own term; it is vocabulary borrowed
            from other payment platforms.
          </em>
        </>
      ),
    },
  },
  {
    q: {
      no: "Hva er den vanligste feilen i en Vipps-integrasjon?",
      en: "What is the most common mistake in a Vipps integration?",
    },
    a: {
      no: (
        <>
          Å tro på webhooken. Vipps anbefaler selv både webhooks og oppslag, og
          status skal hentes fra <em>Get payment details</em>. Den nest
          vanligste er mer subtil: en betaling blir stående i{" "}
          <code className="font-mono">AUTHORIZED</code> også <em>etter</em> at
          du har trukket den — tilstanden forteller deg ikke om du har trukket.
          Behandler du «AUTHORIZED» som «ikke trukket ennå», trekker du to
          ganger. Og reservasjoner som ikke skal trekkes, må kanselleres før
          fristen, ellers ligger kundens penger unødvendig sperret.
        </>
      ),
      en: (
        <>
          Believing the webhook. Vipps recommends using both webhooks and
          polling, with status coming from <em>Get payment details</em>. The
          second most common is subtler: a payment stays in{" "}
          <code className="font-mono">AUTHORIZED</code> even <em>after</em> you
          capture it — the state does not tell you whether you captured.
          Treating “AUTHORIZED” as “not captured yet” means capturing twice.
          And reservations you will not capture must be cancelled before the
          deadline, or the customer’s money stays needlessly held.
        </>
      ),
    },
  },
  {
    q: {
      no: "Kan jeg bruke denne koden kommersielt?",
      en: "Can I use this code commercially?",
    },
    a: {
      no: (
        <>
          Ja, uten forbehold. Koden er MIT-lisensiert: bruk den til hva du
          vil, også kommersielt, uten å spørre først. Behold
          copyright-linjen i <code className="font-mono">LICENSE</code>, så
          har du oppfylt hele forpliktelsen.
        </>
      ),
      en: (
        <>
          Yes, with no strings. The code is MIT licensed: use it for
          anything, commercially included, without asking first. Keep the
          copyright line in <code className="font-mono">LICENSE</code> and you
          have met the whole obligation.
        </>
      ),
    },
  },
];

const copy = {
  no: {
    eyebrow: "Spørsmål folk faktisk stiller",
    title: "Før du begynner.",
    lead: "Svarene er hentet fra Vipps' egen dokumentasjon. Der dokumentasjonen er uklar, står det at den er det — i stedet for en gjetning.",
    all: "All dokumentasjon hos Vipps",
  },
  en: {
    eyebrow: "Questions people actually ask",
    title: "Before you start.",
    lead: "Answers come from Vipps' own documentation. Where the documentation is unclear, it says so — instead of guessing.",
    all: "All Vipps documentation",
  },
} satisfies Record<Locale, Record<string, string>>;

export function Faq({ locale }: { locale: Locale }) {
  const c = copy[locale];

  return (
    <section id="faq" className="scroll-mt-8">
      <div className="max-w-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
          {c.eyebrow}
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{c.lead}</p>
      </div>

      <div className="mt-8 divide-y divide-stone-200 overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
        {ITEMS.map((item) => (
          <details key={item.q.no} className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-black transition hover:bg-stone-50 sm:px-7">
              {item.q[locale]}
              <span
                aria-hidden
                className="shrink-0 text-lg text-stone-400 transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="px-5 pb-5 text-sm leading-6 text-stone-600 sm:px-7">
              {item.a[locale]}
            </div>
          </details>
        ))}
      </div>

      <a
        href={DOC}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm font-bold text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
      >
        {c.all} ↗
      </a>
    </section>
  );
}
