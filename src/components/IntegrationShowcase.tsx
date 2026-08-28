"use client";

import { useState } from "react";
import { CopyBlock } from "@/components/CopyBlock";

const REPO = "https://github.com/aridder/vipps-starter/blob/main";

const QUICK_START = `git clone https://github.com/aridder/vipps-starter
cd vipps-starter
cp .env.example .env
npm install && npm run db:up && npm run db:reset
npm run dev`;

type Snippet = {
  id: string;
  tab: { no: string; en: string };
  blurb: { no: string; en: string };
  file: string;
  code: string;
};

const SNIPPETS: Snippet[] = [
  {
    id: "create",
    tab: { no: "Ta en betaling", en: "Take a payment" },
    blurb: {
      no: "Ett kall til ePayment. Referansen er også idempotensnøkkelen, så et forsøk nummer to returnerer den samme betalingen i stedet for å lage en ny.",
      en: "One call to ePayment. The reference doubles as the idempotency key, so a retry returns the same payment instead of creating a second one.",
    },
    file: "src/server/vipps.ts",
    code: `const res = await fetch(\`\${BASE}/epayment/v1/payments\`, {
  method: "POST",
  headers: {
    ...baseHeaders(msn),
    Authorization: \`Bearer \${token}\`,
    // The reference identifies exactly one payment, so it is
    // the natural idempotency key: a retry returns the same
    // payment instead of being rejected as a duplicate.
    "Idempotency-Key": reference,
  },
  body: JSON.stringify({
    amount: { currency: "NOK", value: amountOre },
    paymentMethod: { type: "WALLET" },
    reference,
    userFlow: "WEB_REDIRECT",   // or "QR"
    returnUrl,
    paymentDescription: description.slice(0, 100),
  }),
});`,
  },
  {
    id: "truth",
    tab: { no: "Stol aldri på webhooken", en: "Never trust the webhook" },
    blurb: {
      no: "En webhook-kropp og en redirect kan begge forfalskes. Begge brukes derfor kun som et signal om å gå og spørre Vipps hva som faktisk skjedde.",
      en: "A webhook body and a redirect can both be forged. Both are used purely as a signal to go and ask Vipps what actually happened.",
    },
    file: "src/server/payments.ts",
    code: `// The webhook told us something changed. It is not proof.
// Go and fetch the authoritative status, then act on that.
export async function syncPaymentStatus(db, reference) {
  const payment = await db.payment.findUnique({
    where: { reference },
  });
  if (!payment) return null;

  const remote = await getPayment(msn, reference);
  const newStatus = mapVippsState(remote.state);

  // Capture only once we have seen AUTHORIZED from Vipps
  // itself — never because a request said so.
  if (newStatus === "AUTHORIZED" && payment.autoCapture) {
    await capturePayment({ msn, reference, amountOre });
  }
  return db.payment.update({
    where: { id: payment.id },
    data: { status: newStatus },
  });
}`,
  },
  {
    id: "webhook",
    tab: { no: "Verifiser signaturen", en: "Verify the signature" },
    blurb: {
      no: "HMAC-SHA256 over metode, sti, dato, host og innholds-hash — sammenlignet i konstant tid, så en angriper ikke kan gjette seg fram byte for byte.",
      en: "HMAC-SHA256 over method, path, date, host and content hash — compared in constant time, so an attacker cannot guess it byte by byte.",
    },
    file: "src/server/vipps-webhooks.ts",
    code: `const contentHash = createHash("sha256")
  .update(rawBody, "utf8")
  .digest("base64");

const signedString =
  \`\${method}\\n\${pathAndQuery}\\n\` +
  \`\${xMsDate};\${host};\${contentHash}\`;

const signature = createHmac("sha256", secret)
  .update(signedString, "utf8")
  .digest("base64");

// timingSafeEqual — a plain !== leaks how much matched
return safeEqual(expected, authorization);`,
  },
  {
    id: "recurring",
    tab: { no: "Faste trekk", en: "Recurring charges" },
    blurb: {
      no: "En avtale i Vipps, og en daglig kjøring som lager trekket tre dager før forfall. Nøkkelen er datobasert, så samme dag aldri trekkes to ganger.",
      en: "An agreement in Vipps, plus a daily run that creates the charge three days before it falls due. The key is date-based, so the same day is never charged twice.",
    },
    file: "src/server/agreements.ts",
    code: `// Deterministic per agreement per due date. If the cron
// runs twice, the second call is the same charge — not a
// second withdrawal from the customer.
const reference =
  \`sub-\${agreement.id}-\${ymd(agreement.nextChargeDate)}\`;

await createCharge({
  msn,
  agreementId: agreement.vippsId,
  reference,
  amountOre: agreement.amountOre,
  due: dueDate,
  description: agreement.description,
});

// Inside createCharge that same string is used twice — as
// the idempotency key Vipps dedupes on, and as the orderId
// it stores against the charge:
headers: { "Idempotency-Key": params.reference }
body:    { orderId: params.reference, retryDays: 5, ... }`,
  },
];

export function IntegrationShowcase({ locale }: { locale: "no" | "en" }) {
  const no = locale === "no";
  const [active, setActive] = useState(SNIPPETS[0]!.id);
  const snippet = SNIPPETS.find((s) => s.id === active) ?? SNIPPETS[0]!;

  return (
    <section id="kode" className="scroll-mt-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5b24]">
            {no ? "Ta den i bruk" : "Put it to work"}
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {no
              ? "Ekte kode fra dette repoet."
              : "Real code from this repository."}
          </h2>
        </div>
        <p className="text-sm leading-6 text-stone-600 lg:pb-1">
          {no
            ? "Ingenting under er skrevet for en demo. Det er de samme linjene som kjører betalingen du kan prøve lenger nede på siden — kopier dem, eller klon hele appen."
            : "Nothing below was written for a demo. These are the same lines that run the payment you can try further down this page — copy them, or clone the whole app."}
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-4">
          <CopyBlock
            locale={locale}
            label={no ? "Kjør den lokalt" : "Run it locally"}
            code={QUICK_START}
          />
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-black">
              {no ? "Så trenger du Vipps-nøkler" : "Then you need Vipps keys"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {no ? (
                <>
                  Hent test-nøkler i{" "}
                  <a
                    href="https://portal.vippsmobilepay.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Vipps-portalen
                  </a>{" "}
                  og legg dem i <code className="font-mono">.env</code>. Alt
                  peker mot testmiljøet som standard — du kan ikke flytte ekte
                  penger ved et uhell.
                </>
              ) : (
                <>
                  Get test keys from the{" "}
                  <a
                    href="https://portal.vippsmobilepay.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Vipps portal
                  </a>{" "}
                  and put them in <code className="font-mono">.env</code>.
                  Everything points at the test environment by default — you
                  cannot move real money by accident.
                </>
              )}
            </p>
          </div>
        </div>

        <div>
          <div
            role="tablist"
            aria-label={no ? "Kodeeksempler" : "Code examples"}
            className="flex flex-wrap gap-2"
          >
            {SNIPPETS.map((s) => {
              const selected = s.id === active;
              return (
                <button
                  key={s.id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setActive(s.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    selected
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900"
                  }`}
                >
                  {no ? s.tab.no : s.tab.en}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm leading-6 text-stone-600">
            {no ? snippet.blurb.no : snippet.blurb.en}
          </p>

          <div className="mt-3">
            <CopyBlock
              locale={locale}
              code={snippet.code}
              label={snippet.file}
              sourceHref={`${REPO}/${snippet.file}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
