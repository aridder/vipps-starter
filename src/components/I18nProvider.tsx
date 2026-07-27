"use client";

import { createContext, useContext, useMemo } from "react";
import { type Locale, type TranslateFn, translator } from "@/lib/i18n";

type I18n = { locale: Locale; t: TranslateFn };

const I18nContext = createContext<I18n>({ locale: "no", t: (k) => k });

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18n>(() => ({ locale, t: translator(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// Switch locale by setting the cookie and reloading (server picks it up).
export function setLocale(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;
  window.location.reload();
}
