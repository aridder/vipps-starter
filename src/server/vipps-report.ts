import { BASE, baseHeaders, getAccessToken } from "@/server/vipps";

type Ledger = {
  ledgerId: string;
  currency: string;
  settlesForRecipientHandles?: string[];
  salesUnits?: Array<{ name?: string; recipientHandle?: string }>;
};

export type ReportEntry = {
  pspReference?: string;
  time: string;
  ledgerDate: string;
  entryType: string;
  reference?: string;
  currency: string;
  amount: number;
};

type ReportResponse = {
  cursor?: string;
  hasMore?: boolean;
  tryLater?: boolean;
  items?: ReportEntry[];
};

// Same header set as every other Vipps module. The subscription key is not
// optional: Vipps fronts these APIs with Azure API Management, which rejects a
// request without `Ocp-Apim-Subscription-Key` before it ever reaches Report —
// and this module turns any non-OK status into a generic "unavailable", so the
// omission surfaced as an empty reconciliation tab rather than as an error.
async function reportFetch<T>(
  msn: string,
  path: string,
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
}> {
  const token = await getAccessToken();
  const response = await fetch(`${BASE}${path}`, {
    headers: { ...baseHeaders(msn), Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 404) {
    return { ok: true, status: 404, data: null };
  }
  if (!response.ok) {
    return { ok: false, status: response.status, data: null };
  }
  return { ok: true, status: response.status, data: (await response.json()) as T };
}

export async function getReportOverview(msn: string, date: string) {
  try {
    const ledgersResult = await reportFetch<{ items?: Ledger[] }>(
      msn,
      `/settlement/v1/ledgers?settlesForRecipientHandles=${encodeURIComponent(`api:${msn}`)}`,
    );
    if (!ledgersResult.ok) {
      return unavailable(
        `Report API avviste ledger-oppslaget (${ledgersResult.status}).`,
        date,
      );
    }
    const ledgers = ledgersResult.data?.items ?? [];
    const ledger =
      ledgers.find((item) =>
        item.settlesForRecipientHandles?.includes(`api:${msn}`),
      ) ?? ledgers[0];
    if (!ledger) {
      return unavailable(
        "Ingen Report API-ledger er tilgjengelig for dette salgsstedet.",
        date,
      );
    }

    const [fundsResult, feesResult] = await Promise.all([
      reportFetch<ReportResponse>(
        msn,
        `/report/v2/ledgers/${encodeURIComponent(ledger.ledgerId)}/funds/dates/${date}`,
      ),
      reportFetch<ReportResponse>(
        msn,
        `/report/v2/ledgers/${encodeURIComponent(ledger.ledgerId)}/fees/dates/${date}`,
      ),
    ]);
    if (!fundsResult.ok || !feesResult.ok) {
      return unavailable(
        `Report API kunne ikke hente dagen (funds ${fundsResult.status}, fees ${feesResult.status}).`,
        date,
      );
    }

    const funds = (fundsResult.data?.items ?? []).slice(0, 200);
    const fees = (feesResult.data?.items ?? []).slice(0, 200);
    return {
      available: true as const,
      date,
      ledger: {
        id: ledger.ledgerId,
        currency: ledger.currency,
        salesUnit:
          ledger.salesUnits?.find(
            (unit) => unit.recipientHandle === `api:${msn}`,
          )?.name ??
          ledger.salesUnits?.[0]?.name ??
          null,
      },
      funds,
      fees,
      fundsNetOre: funds.reduce((sum, entry) => sum + entry.amount, 0),
      feesNetOre: fees.reduce((sum, entry) => sum + entry.amount, 0),
      truncated:
        (fundsResult.data?.hasMore ?? false) ||
        (feesResult.data?.hasMore ?? false),
      tryLater:
        (fundsResult.data?.tryLater ?? false) ||
        (feesResult.data?.tryLater ?? false),
    };
  } catch (error) {
    return unavailable(
      error instanceof Error
        ? error.message
        : "Report API er ikke tilgjengelig.",
      date,
    );
  }
}

function unavailable(reason: string, date: string) {
  return {
    available: false as const,
    date,
    reason: reason.slice(0, 240),
  };
}
