"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { Role } from "@prisma/client";
import { useI18n } from "@/components/I18nProvider";

const ROLE_LABELS: Record<Role, string> = {
  MEMBER: "Member",
  ADMIN: "Admin",
  OWNER: "Owner",
};
const EDITABLE_ROLES: Role[] = [Role.ADMIN, Role.OWNER];

export default function SettingsPage() {
  const { locale, t } = useI18n();
  const utils = api.useUtils();
  const features = api.meta.features.useQuery();
  const me = api.meta.me.useQuery(undefined, { retry: false });
  const settings = api.org.settings.useQuery(undefined, { retry: false });
  const members = api.org.members.useQuery(undefined, { retry: false });

  const [name, setName] = useState("");
  const [msn, setMsn] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (settings.data && !loaded) {
      setName(settings.data.name);
      setMsn(settings.data.vippsMsn ?? "");
      setLoaded(true);
    }
  }, [settings.data, loaded]);

  const updateInfo = api.org.updateInfo.useMutation({
    onSuccess: () => void utils.org.settings.invalidate(),
  });
  const connectVipps = api.org.connectVipps.useMutation({
    onSuccess: () => void utils.org.settings.invalidate(),
  });
  const disconnectVipps = api.org.disconnectVipps.useMutation({
    onSuccess: () => void utils.org.settings.invalidate(),
  });

  const invalidateMembers = () => void utils.org.members.invalidate();
  const setRoles = api.org.setRoles.useMutation({ onSuccess: invalidateMembers });
  const [email, setEmail] = useState("");
  const addMember = api.org.addMember.useMutation({
    onSuccess: () => {
      setEmail("");
      invalidateMembers();
    },
  });
  const removeMember = api.org.removeMember.useMutation({
    onSuccess: invalidateMembers,
  });

  if (me.isSuccess && !me.data.isAdmin) {
    return <p className="text-sm text-stone-500">{t("settings.requiresAdmin")}</p>;
  }

  function toggleRole(userId: string, roles: Role[], role: Role) {
    const has = roles.includes(role);
    const next = has ? roles.filter((r) => r !== role) : [...roles, role];
    setRoles.mutate({ userId, roles: next });
  }

  const s = settings.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="settings-page">
      <header className="rounded-[2rem] bg-stone-900 p-6 text-white sm:p-8">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">
          {locale === "no" ? "Kun administrator" : "Administrators only"}
        </div>
        <h1 className="mt-3 text-3xl font-black">{t("settings.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
          {locale === "no"
            ? "Koble organisasjonen til riktig Vipps-salgssted og styr hvem som kan administrere betalinger. Nøkler håndteres av plattformen – MSN identifiserer mottakeren."
            : "Connect the organization to the correct Vipps sales unit and control who can manage payments. Keys are handled by the platform – the MSN identifies the recipient."}
        </p>
      </header>

      {/* Organization info */}
      <form
        className="space-y-3 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          updateInfo.mutate({ name, vippsMsn: msn || undefined });
        }}
      >
        <div>
          <h2 className="font-black">{t("settings.org")}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {locale === "no"
              ? "MSN er Vipps sitt nummer for salgsstedet som skal motta pengene."
              : "The MSN is Vipps' identifier for the sales unit that receives the funds."}
          </p>
        </div>
        <input
          aria-label={t("settings.orgName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("settings.orgName")}
          required
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          aria-label={t("settings.msn")}
          value={msn}
          onChange={(e) => setMsn(e.target.value)}
          inputMode="numeric"
          placeholder={t("settings.msn")}
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={updateInfo.isPending}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("settings.save")}
        </button>
      </form>

      {/* Vipps connection */}
      {s && (
        <div className="space-y-3 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-black">{t("settings.vippsConnection")}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {locale === "no"
                ? "Tilkobling registrerer organisasjonens webhook og aktiverer betaling mot valgt MSN."
                : "Connecting registers the organization's webhook and enables payments for the selected MSN."}
            </p>
          </div>
          {!s.vippsPlatformReady ? (
            <p className="text-xs text-stone-500">
              {t("settings.platformMissing")}
            </p>
          ) : !s.vippsMsn ? (
            <p className="text-xs text-stone-500">
              {t("settings.enterMsn")}
            </p>
          ) : s.vippsConnected ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <span>●</span> {t("settings.connected", { msn: s.vippsMsn })}
              </div>
              {disconnectVipps.error && (
                <p className="text-xs text-red-600">
                  {disconnectVipps.error.message}
                </p>
              )}
              <button
                onClick={() => disconnectVipps.mutate()}
                disabled={disconnectVipps.isPending}
                className="rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600 disabled:opacity-50"
              >
                {t("settings.disconnect")}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-stone-500">
                {t("settings.msnSaved", { msn: s.vippsMsn })}
              </p>
              {connectVipps.error && (
                <p className="text-xs text-red-600">
                  {connectVipps.error.message}
                </p>
              )}
              <button
                onClick={() => connectVipps.mutate()}
                disabled={connectVipps.isPending}
                className="rounded-xl bg-[#ff5b24] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {connectVipps.isPending ? t("settings.connecting") : t("settings.connect")}
              </button>
            </>
          )}
        </div>
      )}

      {/* Members (multi-tenant only) */}
      {features.data?.multiTenant && (
        <>
          <form
            className="space-y-3 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) addMember.mutate({ email });
            }}
          >
            <div>
              <h2 className="font-black">{t("settings.addMember")}</h2>
              <p className="mt-1 text-sm text-stone-500">
                {locale === "no"
                  ? "Bare ADMIN og OWNER får tilgang til driftssentralen og pengeoperasjoner."
                  : "Only ADMIN and OWNER can access operations and money actions."}
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={addMember.isPending || !email}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t("settings.add")}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {members.data?.map((m) => (
              <div key={m.userId} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold">{m.name}</div>
                    {m.email && (
                      <div className="truncate text-xs text-stone-500">
                        {m.email}
                      </div>
                    )}
                  </div>
                  {m.userId !== me.data?.id && (
                    <button
                      onClick={() => removeMember.mutate({ userId: m.userId })}
                      className="shrink-0 text-xs text-red-500 underline"
                    >
                      {t("settings.remove")}
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {EDITABLE_ROLES.map((role) => {
                    const active = m.roles.includes(role);
                    return (
                      <button
                        key={role}
                        disabled={setRoles.isPending}
                        onClick={() => toggleRole(m.userId, m.roles, role)}
                        className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                          active
                            ? "bg-indigo-600 text-white"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
