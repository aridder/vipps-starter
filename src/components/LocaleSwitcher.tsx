"use client";

import { setLocale, useI18n } from "@/components/I18nProvider";
import { locales } from "@/lib/i18n";

export function LocaleSwitcher() {
  const { locale } = useI18n();
  return (
    <div className="flex items-center gap-1 text-xs">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => l !== locale && setLocale(l)}
          className={`rounded px-1.5 py-0.5 font-semibold uppercase ${
            l === locale ? "bg-stone-200 text-stone-800" : "text-stone-400"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
