"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  MEMBER: "Member",
  ADMIN: "Admin",
  OWNER: "Owner",
};
const EDITABLE_ROLES: Role[] = [Role.ADMIN, Role.OWNER];

export default function SettingsPage() {
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
    return <p className="text-sm text-stone-500">Requires admin access.</p>;
  }

  function toggleRole(userId: string, roles: Role[], role: Role) {
    const has = roles.includes(role);
    const next = has ? roles.filter((r) => r !== role) : [...roles, role];
    setRoles.mutate({ userId, roles: next });
  }

  const s = settings.data;

  return (
    <div className="space-y-5" data-testid="settings-page">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Organization info */}
      <form
        className="space-y-2 rounded-2xl bg-white p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          updateInfo.mutate({ name, vippsMsn: msn || undefined });
        }}
      >
        <h2 className="text-sm font-semibold text-stone-600">Organization</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organization name"
          required
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={msn}
          onChange={(e) => setMsn(e.target.value)}
          inputMode="numeric"
          placeholder="Vipps MSN (digits only)"
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={updateInfo.isPending}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save
        </button>
      </form>

      {/* Vipps connection */}
      {s && (
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-600">
            Vipps connection
          </h2>
          {!s.vippsPlatformReady ? (
            <p className="text-xs text-stone-500">
              Platform is missing Vipps keys (set by the operator).
            </p>
          ) : !s.vippsMsn ? (
            <p className="text-xs text-stone-500">
              Enter the MSN above and save, then connect.
            </p>
          ) : s.vippsConnected ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <span>✅</span> Connected · MSN {s.vippsMsn}
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
                Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-stone-500">
                MSN {s.vippsMsn} saved. Connect to register the webhook and
                activate payments for this organization.
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
                {connectVipps.isPending ? "Connecting…" : "Connect to Vipps"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Members (multi-tenant only) */}
      {features.data?.multiTenant && (
        <>
          <form
            className="space-y-2 rounded-2xl bg-white p-4 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) addMember.mutate({ email });
            }}
          >
            <h2 className="text-sm font-semibold text-stone-600">Add member</h2>
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
                Add
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
                      remove
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
