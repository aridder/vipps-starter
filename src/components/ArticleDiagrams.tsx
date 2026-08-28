import type { Locale } from "@/lib/i18n";

/**
 * Diagrams for the recurring article. Server components — no interactivity —
 * and deliberately components rather than exported images: they stay crisp at
 * any width, follow the app's palette, and cannot drift from the prose the way
 * a checked-in PNG does.
 */

const INK = "#1c1917";
const MUTED = "#78716c";
const LINE = "#e7e5e4";
const SURFACE = "#fafaf9";
const ACCENT = "#ff5b24";
const GOOD = "#059669";
const BAD = "#dc2626";
const FAINT = "#a8a29e";

function Frame({
  children,
  caption,
  viewBox,
  minWidth = 680,
  title,
  desc,
  id,
}: {
  children: React.ReactNode;
  caption: React.ReactNode;
  viewBox: string;
  minWidth?: number;
  title: string;
  desc: string;
  id: string;
}) {
  return (
    <figure className="my-10 overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
      <div className="overflow-x-auto p-5 sm:p-7">
        <svg
          viewBox={viewBox}
          role="img"
          aria-labelledby={`${id}-t ${id}-d`}
          className="h-auto w-full"
          style={{ minWidth }}
        >
          <title id={`${id}-t`}>{title}</title>
          <desc id={`${id}-d`}>{desc}</desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={MUTED} />
            </marker>
            <marker
              id={`${id}-arrow-accent`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={ACCENT} />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <figcaption className="border-t border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-6 text-stone-600 sm:px-7">
        {caption}
      </figcaption>
    </figure>
  );
}

/** Agreement → charge → payment. The mental model everything else hangs on. */
export function ModelDiagram({ locale }: { locale: Locale }) {
  const no = locale === "no";
  const cols = [
    {
      x: 8,
      name: "Agreement",
      sub: no ? "recurring/v3, hos Vipps" : "recurring/v3, at Vipps",
      body: no ? "Én per abonnent.\nKunden godkjenner\nén gang." : "One per subscriber.\nThe customer approves\nonce.",
    },
    {
      x: 268,
      name: "AgreementCharge",
      sub: no ? "recurring/v3, hos Vipps" : "recurring/v3, at Vipps",
      body: no ? "Én per periode.\nDu oppretter den.\nVipps gjør det ikke." : "One per period.\nYou create it.\nVipps does not.",
      flag: true,
    },
    {
      x: 528,
      name: "Payment",
      sub: no ? "din database" : "your database",
      body: no ? "Din bok.\nSpeiler det Vipps\nsier er sant." : "Your ledger.\nMirrors what Vipps\nsays is true.",
    },
  ];

  return (
    <Frame
      id="model"
      viewBox="0 0 760 260"
      title={no ? "Avtale, trekk og betaling" : "Agreement, charge and payment"}
      desc={
        no
          ? "Tre objekter: avtalen godkjennes én gang hos Vipps, trekket opprettes av din egen cron for hver periode, og betalingen er din egen bokføring."
          : "Three objects: the agreement is approved once at Vipps, the charge is created by your own cron for each period, and the payment is your own ledger."
      }
      caption={
        no ? (
          <>
            <strong className="font-black text-stone-900">
              Vipps lager ikke trekkene for deg.
            </strong>{" "}
            Kommer du fra Stripe Subscriptions er det den største forskjellen:
            avtalen er bare et samtykke. Noen må be om pengene hver periode, og
            det er din cron.
          </>
        ) : (
          <>
            <strong className="font-black text-stone-900">
              Vipps does not create the charges for you.
            </strong>{" "}
            Coming from Stripe Subscriptions this is the big difference: the
            agreement is only consent. Something has to ask for the money each
            period, and that something is your cron.
          </>
        )
      }
    >
      {cols.map((c) => (
        <g key={c.name}>
          <rect
            x={c.x}
            y={40}
            width={200}
            height={140}
            rx={16}
            fill={SURFACE}
            stroke={c.flag ? ACCENT : LINE}
            strokeWidth={c.flag ? 2 : 1.5}
          />
          <text x={c.x + 18} y={70} fontSize={16} fontWeight={800} fill={INK}>
            {c.name}
          </text>
          <text x={c.x + 18} y={90} fontSize={11.5} fill={FAINT}>
            {c.sub}
          </text>
          {c.body.split("\n").map((line, i) => (
            <text
              key={line}
              x={c.x + 18}
              y={118 + i * 17}
              fontSize={12.5}
              fill={MUTED}
            >
              {line}
            </text>
          ))}
        </g>
      ))}

      <path d="M 212 110 L 262 110" stroke={ACCENT} strokeWidth={2} fill="none" markerEnd="url(#model-arrow-accent)" />
      <text x={237} y={100} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
        cron
      </text>
      <path d="M 472 110 L 522 110" stroke={MUTED} strokeWidth={2} fill="none" markerEnd="url(#model-arrow)" />
      <text x={497} y={100} textAnchor="middle" fontSize={11} fontWeight={700} fill={MUTED}>
        sync
      </text>

      <text x={368} y={216} textAnchor="middle" fontSize={12} fontWeight={700} fill={ACCENT}>
        {no
          ? "↑ dette steget finnes ikke hos Vipps — din cron lager det 3 dager før forfall"
          : "↑ this step does not exist at Vipps — your cron creates it 3 days before it falls due"}
      </text>
    </Frame>
  );
}

/** Why the idempotency key must come from something durable you own. */
export function IdempotencyDiagram({ locale }: { locale: Locale }) {
  const no = locale === "no";

  const lanes = [
    {
      y: 46,
      ok: true,
      label: no ? "Nøkkel fra egen id" : "Key from your own id",
      key: "sub-clx7…-2026-09-01",
      note: no ? "Samme nøkkel begge ganger → Vipps svarer med SAMME trekk" : "Same key both times → Vipps returns the SAME charge",
      result: no ? "1 belastning" : "1 charge",
    },
    {
      y: 152,
      ok: false,
      label: no ? "Nøkkel fra randomUUID()" : "Key from randomUUID()",
      key: "a3f1… / 9c02…",
      note: no ? "Ny nøkkel per forsøk → Vipps ser to ulike operasjoner" : "New key per attempt → Vipps sees two different operations",
      result: no ? "2 belastninger" : "2 charges",
    },
  ];

  return (
    <Frame
      id="idem"
      viewBox="0 0 760 268"
      title={no ? "Idempotens ved nytt forsøk" : "Idempotency on retry"}
      desc={
        no
          ? "To baner: en nøkkel utledet av din egen varige id gir samme trekk ved nytt forsøk, mens en tilfeldig nøkkel per forsøk gir to trekk."
          : "Two lanes: a key derived from your own durable id yields the same charge on retry, while a random key per attempt yields two charges."
      }
      caption={
        no ? (
          <>
            Faren er ikke at kallet feiler — det er{" "}
            <strong className="font-black text-stone-900">
              vinduet mellom at Vipps har opprettet trekket og at du har lagret
              det
            </strong>
            . Dør prosessen der, må neste forsøk bære nøyaktig samme nøkkel.
            Derfor må den utledes av noe du eier fra før, aldri genereres i
            øyeblikket.
          </>
        ) : (
          <>
            The danger is not that the call fails — it is{" "}
            <strong className="font-black text-stone-900">
              the window between Vipps creating the charge and you storing it
            </strong>
            . If the process dies there, the next attempt must carry exactly the
            same key. So it has to be derived from something you already own,
            never generated on the spot.
          </>
        )
      }
    >
      {lanes.map((lane) => {
        const c = lane.ok ? GOOD : BAD;
        return (
          <g key={lane.label}>
            <rect x={8} y={lane.y} width={744} height={86} rx={14} fill={SURFACE} stroke={LINE} strokeWidth={1.5} />
            <circle cx={30} cy={lane.y + 24} r={5} fill={c} />
            <text x={44} y={lane.y + 28} fontSize={13.5} fontWeight={800} fill={INK}>
              {lane.label}
            </text>
            <text x={44} y={lane.y + 50} fontSize={12} fill={c} fontFamily="ui-monospace, monospace">
              {lane.key}
            </text>
            <text x={44} y={lane.y + 70} fontSize={12} fill={MUTED}>
              {lane.note}
            </text>
            <rect x={614} y={lane.y + 26} width={122} height={34} rx={10} fill={lane.ok ? "#ecfdf5" : "#fef2f2"} stroke={c} strokeWidth={1.5} />
            <text x={675} y={lane.y + 48} textAnchor="middle" fontSize={13} fontWeight={800} fill={c}>
              {lane.result}
            </text>
          </g>
        );
      })}

      <text x={8} y={26} fontSize={11} fontWeight={700} fill={FAINT} letterSpacing="0.1em">
        {no ? "CRON KJØRER TO GANGER — KRASJ FØR SVARET REKKER FRAM" : "CRON RUNS TWICE — CRASH BEFORE THE RESPONSE ARRIVES"}
      </text>
      <text x={8} y={258} fontSize={11.5} fill={FAINT} fontFamily="ui-monospace, monospace">
        {no
          ? "reference = `sub-${agreement.id}-${ymd(agreement.nextChargeDate)}`  — planlagt periode, ikke klokkeslett"
          : "reference = `sub-${agreement.id}-${ymd(agreement.nextChargeDate)}`  — the planned period, not the clock"}
      </text>
    </Frame>
  );
}

/** AUTHORIZED does not move on capture. The aggregate does. */
export function AuthorizedDiagram({ locale }: { locale: Locale }) {
  const no = locale === "no";
  return (
    <Frame
      id="auth"
      viewBox="0 0 760 250"
      title={no ? "state mot aggregate" : "state versus aggregate"}
      desc={
        no
          ? "Tilstanden AUTHORIZED står stille gjennom hele forløpet, mens beløpsfeltene i aggregate endrer seg fra null til trukket beløp."
          : "The AUTHORIZED state stays put throughout, while the amount fields in aggregate change from zero to the captured amount."
      }
      caption={
        no ? (
          <>
            <strong className="font-black text-stone-900">
              Tilstanden flytter seg ikke. Tallene gjør.
            </strong>{" "}
            Du fører ikke egne tall ved siden av — du speiler{" "}
            <code className="font-mono text-[13px]">aggregate</code> fra Vipps.
            Leser du bare <code className="font-mono text-[13px]">state</code>,
            ser et trukket beløp ut som et utrukket.
          </>
        ) : (
          <>
            <strong className="font-black text-stone-900">
              The state does not move. The numbers do.
            </strong>{" "}
            You do not keep your own parallel count — you mirror{" "}
            <code className="font-mono text-[13px]">aggregate</code> from Vipps.
            Read only <code className="font-mono text-[13px]">state</code> and a
            captured payment looks exactly like an uncaptured one.
          </>
        )
      }
    >
      <rect x={8} y={40} width={500} height={132} rx={16} fill="#f0fdf4" stroke={GOOD} strokeWidth={2} />
      <text x={30} y={72} fontSize={18} fontWeight={800} fill={INK} fontFamily="ui-monospace, monospace">
        state: AUTHORIZED
      </text>
      <text x={30} y={94} fontSize={12} fill={MUTED}>
        {no ? "uendret fra kunden godkjenner til betalingen er ferdig" : "unchanged from approval until the payment is done"}
      </text>

      <text x={30} y={126} fontSize={13} fill={MUTED} fontFamily="ui-monospace, monospace">
        aggregate.capturedAmount:
      </text>
      <text x={250} y={126} fontSize={13} fontWeight={700} fill={FAINT} fontFamily="ui-monospace, monospace">
        0
      </text>
      <path d="M 272 122 L 306 122" stroke={ACCENT} strokeWidth={2} markerEnd="url(#auth-arrow-accent)" />
      <text x={316} y={126} fontSize={13} fontWeight={800} fill={ACCENT} fontFamily="ui-monospace, monospace">
        25000
      </text>

      <text x={30} y={152} fontSize={12} fill={FAINT}>
        {no ? "capture endret tallet — ikke tilstanden" : "capture changed the number — not the state"}
      </text>

      <rect x={534} y={40} width={218} height={132} rx={16} fill={SURFACE} stroke={LINE} strokeWidth={1.5} />
      <text x={552} y={68} fontSize={11.5} fontWeight={700} fill={FAINT} letterSpacing="0.08em">
        {no ? "DIN AVLEDNING" : "YOUR DERIVATION"}
      </text>
      {[
        "capturedOre > 0",
        no ? "  → PAID" : "  → PAID",
        "capturedOre === 0",
        no ? "  → RESERVERT" : "  → RESERVED",
      ].map((line, i) => (
        <text
          key={line}
          x={552}
          y={94 + i * 19}
          fontSize={12.5}
          fill={i % 2 ? ACCENT : MUTED}
          fontWeight={i % 2 ? 700 : 400}
          fontFamily="ui-monospace, monospace"
        >
          {line}
        </text>
      ))}

      <text x={8} y={206} fontSize={12} fill={MUTED}>
        {no
          ? "Vipps sender også cancelledAmount og refundedAmount på samme objekt. Alt du trenger ligger der."
          : "Vipps also sends cancelledAmount and refundedAmount on the same object. Everything you need is there."}
      </text>
    </Frame>
  );
}
