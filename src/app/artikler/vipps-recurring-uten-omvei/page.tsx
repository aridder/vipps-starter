import type { Metadata } from "next";
import Link from "next/link";
import { resolveSite } from "@/lib/site";
import { PaymentFlowDiagram } from "@/components/PaymentFlowDiagram";
import {
  AuthorizedDiagram,
  IdempotencyDiagram,
  ModelDiagram,
} from "@/components/ArticleDiagrams";
import { CopyBlock } from "@/components/CopyBlock";

// Written in Norwegian only, on purpose: the audience that hires for Vipps
// work is Norwegian, and a half-translated article reads worse than an
// untranslated one. The app chrome around it stays bilingual, but the
// diagrams are pinned to Norwegian so they cannot switch language underneath
// Norwegian prose — that combination reads worse than either pure one.
const PUBLISHED = "28. august 2026";
const REPO = "https://github.com/aridder/vipps-starter";

export const metadata: Metadata = {
  title: "Vipps Recurring uten omvei",
  description:
    "Faste trekk med Vipps finnes ikke hos noen betalingsformidler — du snakker med API-et selv. Fire mønstre som skiller en integrasjon som holder fra en som dobbelttrekker, med hele koden.",
  openGraph: {
    type: "article",
    title: "Vipps Recurring uten omvei",
    description:
      "Fire mønstre som skiller en Vipps-abonnementsintegrasjon som holder fra en som dobbelttrekker. Med hele koden, MIT-lisensiert.",
  },
};

const CHARGE_CODE = `// Nøkkelen utledes av noe vi eier fra før — vår egen
// avtale-id og den PLANLAGTE perioden. Aldri randomUUID(),
// og aldri forfallsdatoen, som flytter seg når cronen er sen.
const reference =
  \`sub-\${agreement.id}-\${ymd(agreement.nextChargeDate)}\`;

// Finnes den allerede lokalt, har vi gjort dette før.
const existing = await db.agreementCharge.findUnique({
  where: { reference },
});
if (existing) continue;

await createCharge({
  msn,
  agreementId: agreement.vippsId,
  reference,
  amountOre: agreement.amountOre,
  due: dueDate,
  description: agreement.description,
});`;

const START_CODE = `git clone https://github.com/aridder/vipps-starter
cd vipps-starter
./scripts/dev setup   # .env, Postgres, migrasjoner og seed
npm run dev`;

function H2({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2
      id={id}
      className="mt-16 scroll-mt-8 text-3xl font-black tracking-tight sm:text-4xl"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-[17px] leading-8 text-stone-700">{children}</p>;
}

export default async function ArticlePage() {
  const site = resolveSite();

  return (
    <article className="mx-auto max-w-3xl pb-10">
      <header>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
          Vipps · faste trekk · TypeScript
        </div>
        <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          Vipps Recurring uten omvei
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-600">
          Faste trekk med Vipps får du ikke gjennom en betalingsformidler — verken
          Stripe, Mollie eller Adyen videreselger dem. Du snakker med API-et
          selv. Fire mønstre skiller en integrasjon som holder fra en som
          dobbelttrekker kunder ved månedsslutt. Her er alle fire, og hele
          koden, MIT-lisensiert.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-stone-200 pt-5 text-sm text-stone-500">
          <span className="font-bold text-stone-800">{site.author.name}</span>
          <span aria-hidden>·</span>
          <span>{PUBLISHED}</span>
          <span aria-hidden>·</span>
          <span>
            Bygger betalings- og plattformløsninger. Denne teksten kommer ut av
            en Vipps-integrasjon jeg har kjørt i produksjon.
          </span>
        </div>
      </header>

      <H2 id="kartet">Kartet, kort fortalt</H2>
      <P>
        Engangsbetaling med Vipps er løst omtrent overalt: det finnes offisielle,
        gratis plugins for WooCommerce, Magento, Shopify, Wix og flere, og de
        dekker der volumet av norske nettbutikker faktisk ligger.
      </P>
      <P>
        Faste trekk er en annen historie. Mollies dokumentasjon svarer
        «Recurring: No». Stripe behandler Vipps som en engangslommebok og er
        fortsatt i lukket forhåndsvisning. Vipps peker selv utviklere mot API-et
        framfor Node-biblioteket sitt, som ikke lenger vedlikeholdes aktivt. Og
        etter at Checkout ble solgt til Kustom, er ePayment og Recurring flatene
        Vipps satser videre på — bygger du på Recurring nå, bygger du på noe de
        beholder.
      </P>
      <P>
        Summen er ikke at noe er ødelagt. Summen er at{" "}
        <strong className="font-bold text-stone-900">
          faste trekk med Vipps er en norsk kapabilitet uten mellomledd
        </strong>
        , og at du derfor må kunne mekanikken selv. API-dokumentasjonen til Vipps
        er blant de bedre jeg har jobbet mot — idempotensregelen står der svart
        på hvitt. Det som mangler er ikke dokumentasjon. Det er kode.
      </P>

      <H2 id="modellen">Mønster 1: tre objekter, ikke ett</H2>
      <P>
        Den vanligste feilantakelsen kommer fra folk som har brukt Stripe
        Subscriptions: at avtalen trekker penger. Det gjør den ikke. Avtalen er
        kundens samtykke. Trekket er en egen ting, og{" "}
        <strong className="font-bold text-stone-900">du må opprette det selv</strong>
        , hver periode.
      </P>
      <ModelDiagram locale="no" />
      <P>
        Det betyr at et abonnement i Vipps krever en cron du eier. Repoet lager
        trekket tre dager før forfall, fordi Vipps krever at forfallsdatoen
        ligger et par dager fram i tid. Går kjøringen én dag, lager den ett
        trekk per avtale som har forfall innen vinduet — ikke ett per periode
        som har passert.
      </P>

      <H2 id="idempotens">Mønster 2: nøkkelen må komme fra noe du eier</H2>
      <P>
        Dette er tyngdepunktet. Vipps krever en{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">
          Idempotency-Key
        </code>{" "}
        på trekk, og et nytt forsøk med samme nøkkel gir deg samme trekk i stedet
        for et nytt. Problemet oppstår ikke når nøkkelen mangler — det oppstår
        når et bibliotek genererer en fersk UUID per kall. Da er et nytt forsøk
        ikke et nytt forsøk for Vipps. Det er en ny betaling.
      </P>
      <IdempotencyDiagram locale="no" />
      <P>
        Legg merke til hva nøkkelen er utledet av: vår egen avtale-id og den{" "}
        <em>planlagte</em> perioden. Ikke Vipps&apos; avtale-id, som er sirkulær
        — nøkkelen må finnes før første vellykkede kall. Og ikke forfallsdatoen,
        som skyves fram når cronen er forsinket. Bruker du den, endrer nøkkelen
        seg i akkurat den situasjonen idempotensen skulle redde deg fra.
      </P>
      <div className="my-8">
        <CopyBlock
          locale="no"
          label="src/server/agreements.ts"
          code={CHARGE_CODE}
          sourceHref={`${REPO}/blob/main/src/server/agreements.ts`}
        />
      </div>
      <P>
        Det er to lag her, og de gjør ikke samme jobb. Oppslaget på{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">
          reference
        </code>{" "}
        i din egen base er den billige veien ut: kjenner du trekket fra før,
        slipper du å ringe Vipps i det hele tatt, og den unike indeksen hindrer
        to rader for samme trekk. Idempotensnøkkelen er det som redder deg når
        du <em>ikke</em> vet — enten fordi prosessen døde mellom Vipps-kallet og
        din commit, eller fordi to kjøringer er i luften samtidig og ingen av dem
        har rukket å lagre noe. Da er nøkkelen det eneste Vipps har å kjenne
        forsøket igjen på.
      </P>
      <P>
        Samme resonnement gjelder capture og refusjon. I repoet er handlingen en
        del av nøkkelen —{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">
          capture-&lt;id&gt;
        </code>{" "}
        mot{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">
          refund-&lt;id&gt;
        </code>{" "}
        — og funksjonen tar nøkkelen som et påkrevd argument uten standardverdi.
        Det er et bevisst valg: en feil du ikke kan kompilere er bedre enn en
        kommentar som ber deg passe på.
      </P>

      <H2 id="status">Mønster 3: status er noe du henter</H2>
      <P>
        Webhooken forteller deg at noe har skjedd. Den er ikke beviset på hva.
        Signaturen kan du verifisere med HMAC, og den bør du sette opp — men
        selv en verifisert webhook leveres minst én gang, uten
        rekkefølgegaranti, og av og til ikke i det hele tatt. En{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">
          captured
        </code>
        -hendelse kan lande før{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">
          authorized
        </code>
        .
      </P>
      <PaymentFlowDiagram locale="no" />
      <P>
        Derfor er den daglige kjøringen ikke bare en trekkmotor, den er også
        backup for tapte hendelser. Det er også grunnen til at repoet tør kjøre
        signaturvalidering i varselmodus som standard — avvik logges, flyten
        fortsetter — og at et oppsett uten lagret hemmelighet ikke stopper noe.
        Slå på håndheving når produksjonsloggene bekrefter at signaturene
        verifiserer. Poenget er at tilliten uansett ikke hviler der: den hviler
        på det autentiserte oppslaget.
      </P>
      <P>
        Én detalj som er lett å overse: sideeffekter må være like idempotente som
        pengene. Når en betaling går fra ubetalt til betalt, oppdateres raden med
        en betingelse om at den ikke allerede er betalt. Da sendes kvitteringen
        nøyaktig én gang, uansett hvor mange webhooks og pollinger som lander
        samtidig.
      </P>

      <H2 id="authorized">Mønster 4: AUTHORIZED betyr ikke «ikke trukket»</H2>
      <P>
        Den detaljen som overrasker de fleste: en Vipps-betaling blir stående i{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">
          AUTHORIZED
        </code>{" "}
        også etter at du har trukket den. Tilstanden flytter seg ikke ved
        capture.
      </P>
      <AuthorizedDiagram locale="no" />
      <P>
        Løsningen er ikke å telle selv. Vipps sender beløpene på samme objekt —
        autorisert, trukket, kansellert og refundert — så du speiler dem. Egen
        parallell telling er nettopp det som driver ut av synk.
      </P>

      <H2 id="stacken">Hva som ligger i repoet</H2>
      <P>
        Alt over er hentet fra en integrasjon som kjører: ePayment med
        reservasjon, trekk og refusjon, Recurring med fornyelsescron, QR, Vipps
        Login, signerte webhooks og avstemming mot Report API.
      </P>
      <P>
        Den delen som er vanskeligst å få riktig, og som jeg vil trekke fram
        særskilt, er{" "}
        <strong className="font-bold text-stone-900">partnermodellen</strong>:
        hver organisasjon har sitt eget salgssted hos Vipps, med egne webhooks,
        og pengene går rett til dem — aldri via plattformen. Det er den
        arkitekturen som gjør at du kan bygge et flerkundeprodukt uten å komme i
        nærheten av konsesjonsplikt, og det er den som er mest arbeid å komme
        fram til selv.
      </P>

      <div className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-wider text-stone-500">
          Hva den ikke gjør
        </h3>
        <ul className="mt-4 space-y-2 text-[15px] leading-7 text-stone-600">
          <li>
            — Enhetstestene dekker idempotensnøkler, auth-policy og rate
            limiting. Trekkmotoren og statussynkroniseringen er dekket av
            e2e-tester, ikke av enhetstester.
          </li>
          <li>
            — Ingen purrelogikk. Vipps prøver et feilet trekk i fem dager; hva
            som skjer med abonnementet etter det, må du bestemme selv.
          </li>
          <li>
            — Express er bygget, men avslått som standard til et ekte produkt og
            levering er satt opp.
          </li>
          <li>
            — Agentic Commerce er en kontrakt, ikke en integrasjon. Ingen
            produksjonskall.
          </li>
          <li>
            — Den forutsetter Prisma og PostgreSQL. Vipps-modulene i{" "}
            <code className="font-mono text-[13.5px]">src/server/</code> er
            derimot uavhengige av resten av appen.
          </li>
        </ul>
      </div>

      <H2 id="kom-i-gang">Kom i gang</H2>
      <P>
        Fra klon til første testbetaling i Vipps-appen er det tre kommandoer og
        en <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[15px]">.env</code>.
        Alt peker mot testmiljøet som standard, så du kan ikke flytte ekte penger
        ved et uhell.
      </P>
      <div className="my-8">
        <CopyBlock locale="no" label="Kom i gang" code={START_CODE} />
      </div>
      <P>
        Vil du se det virke før du kloner:{" "}
        <Link href="/#donate" className="font-semibold text-[#ff5b24] underline underline-offset-4">
          demoen tar imot ekte Vipps-betalinger
        </Link>
        . Det er nøyaktig koden over, inkludert webhooken.
      </P>

      <footer className="mt-14 rounded-[2rem] bg-stone-900 p-7 text-stone-200 sm:p-9">
        <h2 className="text-2xl font-black text-white">Ta det du trenger</h2>
        <p className="mt-3 text-[15px] leading-7 text-stone-300">
          Hele integrasjonen er MIT-lisensiert. Klon den, løft én modul, selg det
          du bygger med den — uten å spørre.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#ff5b24] px-5 py-3 text-sm font-black text-white"
          >
            Se koden på GitHub ↗
          </a>
          <a
            href={`mailto:${site.author.email}`}
            className="rounded-xl border border-stone-700 px-5 py-3 text-sm font-bold text-white hover:bg-stone-800"
          >
            Ta kontakt
          </a>
        </div>
        <p className="mt-6 text-sm leading-7 text-stone-400">
          Jeg tar oppdrag på Vipps-integrasjon, betalingsflyt og Next.js. Bruker
          du koden i noe, hører jeg gjerne om det — issues og e-post er åpne.
        </p>
      </footer>

      <p className="mt-8 text-sm leading-7 text-stone-500">
        Alle påstander er sjekket mot primærkilder 28. august 2026, og lenkene
        går til Vipps&apos;, Stripes og Mollies egen dokumentasjon. Har noe
        endret seg siden, si fra — en tekst om betaling som lyver er verre enn
        ingen tekst.
      </p>
    </article>
  );
}
