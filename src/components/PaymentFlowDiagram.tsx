/**
 * The one diagram this project needs: where payment truth comes from.
 *
 * "Webhooks are triggers, never proof" is repeated in prose across the repo,
 * and prose is a poor medium for it — the whole point is which arrow you are
 * allowed to believe. Server component; no interactivity required.
 */
export function PaymentFlowDiagram({ locale }: { locale: "no" | "en" }) {
  const no = locale === "no";

  const t = {
    customer: no ? "Kunde" : "Customer",
    customerSub: no ? "nettleser + Vipps-app" : "browser + Vipps app",
    app: no ? "Din app" : "Your app",
    appSub: "Next.js · tRPC",
    vipps: "Vipps",
    vippsSub: no ? "ePayment API" : "ePayment API",
    step1: no ? "1. Opprett betaling" : "1. Create payment",
    step2: no ? "2. Til Vipps-appen" : "2. Off to the Vipps app",
    step3: no ? "3. Webhook: «noe skjedde»" : "3. Webhook: “something happened”",
    step3note: no ? "signert, men ikke bevis" : "signed, but not proof",
    step4: no ? "4. Hent status" : "4. Fetch status",
    step4note: no ? "dette er fasiten" : "this is the truth",
  };

  return (
    <figure className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
      <div className="overflow-x-auto p-5 sm:p-8">
        <svg
          viewBox="0 0 780 340"
          role="img"
          aria-labelledby="flow-title flow-desc"
          className="h-auto w-full min-w-[680px]"
        >
          <title id="flow-title">
            {no
              ? "Betalingsflyt: hvor status kommer fra"
              : "Payment flow: where status comes from"}
          </title>
          <desc id="flow-desc">
            {no
              ? "Appen oppretter en betaling hos Vipps, kunden godkjenner i Vipps-appen, Vipps sender en webhook som kun er et signal, og appen henter deretter autoritativ status fra Vipps."
              : "The app creates a payment at Vipps, the customer approves in the Vipps app, Vipps sends a webhook that is only a signal, and the app then fetches authoritative status from Vipps."}
          </desc>

          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#57534e" />
            </marker>
            <marker
              id="arrow-live"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
            </marker>
            <marker
              id="arrow-weak"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a8a29e" />
            </marker>
          </defs>

          {/* Boxes */}
          {[
            { x: 12, label: t.customer, sub: t.customerSub },
            { x: 296, label: t.app, sub: t.appSub },
            { x: 580, label: t.vipps, sub: t.vippsSub },
          ].map((box) => (
            <g key={box.label}>
              <rect
                x={box.x}
                y={128}
                width={188}
                height={80}
                rx={18}
                fill="#fafaf9"
                stroke="#e7e5e4"
                strokeWidth={2}
              />
              <text
                x={box.x + 94}
                y={162}
                textAnchor="middle"
                fontSize={17}
                fontWeight={800}
                fill="#1c1917"
              >
                {box.label}
              </text>
              <text
                x={box.x + 94}
                y={184}
                textAnchor="middle"
                fontSize={12}
                fill="#78716c"
              >
                {box.sub}
              </text>
            </g>
          ))}

          {/* 1. app -> vipps (create) */}
          <path
            d="M 484 150 L 576 150"
            stroke="#57534e"
            strokeWidth={2}
            fill="none"
            markerEnd="url(#arrow)"
          />
          <text x={530} y={140} textAnchor="middle" fontSize={12} fontWeight={700} fill="#44403c">
            {t.step1}
          </text>

          {/* 2. customer -> vipps (approve), arcing over the top */}
          <path
            d="M 106 124 C 106 44, 674 44, 674 124"
            stroke="#57534e"
            strokeWidth={2}
            fill="none"
            strokeDasharray="1 0"
            markerEnd="url(#arrow)"
          />
          <text x={390} y={40} textAnchor="middle" fontSize={12} fontWeight={700} fill="#44403c">
            {t.step2}
          </text>

          {/* 3. vipps -> app (webhook), weak/dashed */}
          <path
            d="M 576 196 L 484 196"
            stroke="#a8a29e"
            strokeWidth={2}
            fill="none"
            strokeDasharray="6 5"
            markerEnd="url(#arrow-weak)"
          />
          <text x={530} y={216} textAnchor="middle" fontSize={12} fontWeight={700} fill="#a8a29e">
            {t.step3}
          </text>
          <text x={530} y={232} textAnchor="middle" fontSize={11} fill="#a8a29e">
            {t.step3note}
          </text>

          {/* 4. app -> vipps (authoritative fetch), emphasised */}
          <path
            d="M 390 212 C 390 292, 674 292, 674 214"
            stroke="#059669"
            strokeWidth={2.5}
            fill="none"
            markerEnd="url(#arrow-live)"
          />
          <text x={530} y={306} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#047857">
            {t.step4} — {t.step4note}
          </text>
        </svg>
      </div>
      <figcaption className="border-t border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-6 text-stone-600 sm:px-8">
        {no ? (
          <>
            <strong className="font-black text-stone-900">
              Den grå pilen er ikke bevis.
            </strong>{" "}
            Webhooken er signert, men den leveres minst én gang, uten
            rekkefølgegaranti, og av og til ikke i det hele tatt. Redirecten
            styres av brukeren. Begge er signaler om å gå og spørre Vipps. Den
            grønne pilen er det eneste stedet appen henter sannheten om at
            penger faktisk har flyttet seg.
          </>
        ) : (
          <>
            <strong className="font-black text-stone-900">
              The grey arrow is not proof.
            </strong>{" "}
            The webhook is signed, but it is delivered at least once, with no
            ordering guarantee, and occasionally not at all. The redirect is
            controlled by the user. Both are signals to go and ask Vipps. The
            green arrow is the one place the app learns that money actually
            moved.
          </>
        )}
      </figcaption>
    </figure>
  );
}
