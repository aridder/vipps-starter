"use client";

import { useEffect, useState } from "react";

/**
 * A code block you can actually take with you. The copy button is the point:
 * the audience for this page is developers and coding agents evaluating
 * whether to adopt the integration, and "select the text carefully" is enough
 * friction to lose them.
 */
export function CopyBlock({
  code,
  label,
  sourceHref,
  sourceLabel,
  locale,
}: {
  code: string;
  label?: string;
  sourceHref?: string;
  sourceLabel?: string;
  locale: "no" | "en";
}) {
  const no = locale === "no";
  const [copied, setCopied] = useState(false);
  const [canCopy, setCanCopy] = useState(false);

  // The clipboard API needs a secure context; without it the button would sit
  // there looking functional and do nothing.
  useEffect(() => {
    setCanCopy(typeof navigator !== "undefined" && !!navigator.clipboard);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCanCopy(false);
    }
  };

  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950">
      <figcaption className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-2.5">
        <span className="truncate font-mono text-xs text-stone-400">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-3">
          {sourceHref && (
            <a
              href={sourceHref}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-stone-400 underline-offset-4 hover:text-white hover:underline"
            >
              {sourceLabel ?? (no ? "Se hele filen" : "See full file")} ↗
            </a>
          )}
          {canCopy && (
            <button
              type="button"
              onClick={copy}
              className="rounded-lg border border-stone-700 px-2.5 py-1 text-xs font-bold text-stone-300 transition hover:border-stone-500 hover:text-white"
            >
              {copied ? (no ? "Kopiert ✓" : "Copied ✓") : no ? "Kopier" : "Copy"}
            </button>
          )}
        </div>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-6 text-stone-200">
        <code>{code}</code>
      </pre>
      <span aria-live="polite" className="sr-only">
        {copied ? (no ? "Kopiert" : "Copied") : ""}
      </span>
    </figure>
  );
}
