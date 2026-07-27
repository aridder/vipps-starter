import { cookies } from "next/headers";
import { resolveSite } from "@/lib/site";
import { resolveLocale, translator } from "@/lib/i18n";
import { DonateWidget } from "@/components/DonateWidget";

// Server-rendered marketing landing (good for SEO, no branding flash). The
// interactive donation is a client island. Branding is runtime-configurable.
export default async function LandingPage() {
  const site = resolveSite();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value);
  const t = translator(locale);

  const features = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`features.f${n}.title`),
    body: t(`features.f${n}.body`),
  }));

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="pt-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ff5b24]/10 px-3 py-1 text-xs font-semibold text-[#ff5b24]">
          {t("hero.badge")}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {site.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-stone-500">{site.tagline}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="#donate"
            className="rounded-xl bg-[#ff5b24] px-5 py-2.5 font-semibold text-white"
          >
            {t("hero.ctaSupport")}
          </a>
          <a
            href={site.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 hover:bg-stone-50"
          >
            {t("hero.ctaGithub")}
          </a>
        </div>
        <p
          className="mx-auto mt-3 max-w-md text-xs text-stone-400"
          dangerouslySetInnerHTML={{ __html: t("hero.realNote") }}
        />
      </section>

      {/* Features */}
      <section>
        <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-stone-400">
          {t("features.title")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-stone-500">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live donation */}
      <DonateWidget siteName={site.name} />

      {/* Built by */}
      <section className="rounded-3xl bg-stone-900 p-6 text-stone-100">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {t("about.builtBy")}
        </div>
        <h2 className="mt-1 text-xl font-bold">{site.author.name}</h2>
        <p className="mt-1 text-sm text-stone-300">{site.author.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={site.author.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-900"
          >
            {t("about.services")}
          </a>
          <a
            href={`mailto:${site.author.email}`}
            className="rounded-xl border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
          >
            {t("about.hire")}
          </a>
        </div>
      </section>

      {/* License */}
      <section className="rounded-2xl bg-white p-5 text-sm shadow-sm">
        <h2 className="font-semibold">{t("license.title")}</h2>
        <p className="mt-1 text-stone-500">
          {t("license.body", { name: site.name })}
        </p>
        <p className="mt-2 text-stone-500">
          <a
            href="https://polyformproject.org/licenses/small-business/1.0.0"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600"
          >
            {t("license.linkText")}
          </a>{" "}
          ·{" "}
          <a href={`mailto:${site.author.email}`} className="text-indigo-600">
            {t("license.contact")}
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        © {site.author.name} ·{" "}
        <a href={site.githubUrl} target="_blank" rel="noreferrer" className="underline">
          GitHub
        </a>{" "}
        ·{" "}
        <a href={site.author.url} target="_blank" rel="noreferrer" className="underline">
          {site.author.url.replace(/^https?:\/\//, "")}
        </a>
      </footer>
    </div>
  );
}
