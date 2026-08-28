import Link from "next/link";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import type { Locale } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/site";

export function Footer({ site, locale }: { site: SiteConfig; locale: Locale }) {
  const no = locale === "no";

  return (
    <footer className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-stone-200 px-4 py-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <span className="flex items-center gap-3">
        © {site.author.name}
        {/* The nav switcher is hidden below `sm`, so on a phone this is the
            only way to reach English. */}
        <span className="sm:hidden">
          <LocaleSwitcher />
        </span>
      </span>
      <span>
        <Link href="/vilkar" className="underline">
          {no ? "Brukervilkår" : "Terms of use"}
        </Link>{" "}
        ·{" "}
        <Link href="/personvern" className="underline">
          {no ? "Personvern" : "Privacy"}
        </Link>{" "}
        ·{" "}
        <a href={site.githubUrl} target="_blank" rel="noreferrer" className="underline">
          GitHub
        </a>{" "}
        ·{" "}
        <a href={site.author.url} target="_blank" rel="noreferrer" className="underline">
          LinkedIn
        </a>
      </span>
    </footer>
  );
}
