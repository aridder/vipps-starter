// Branding & marketing config — resolved at RUNTIME on the server, so your
// hosting platform can set/override these as plain app settings (environment
// variables) without rebuilding the image. Exposed to the client via the
// `meta.site` tRPC query. The defaults below are the maintainer's values.

export type SiteConfig = {
  name: string;
  tagline: string;
  githubUrl: string;
  author: { name: string; tagline: string; url: string; email: string };
};

const env = (key: string, fallback: string) => {
  const v = process.env[key];
  return v && v.trim() !== "" ? v : fallback;
};

export function resolveSite(): SiteConfig {
  return {
    name: env("APP_NAME", "Vipps Starter"),
    tagline: env(
      "SITE_TAGLINE",
      "Starter for folk og AI-agenter som vil ta i bruk Vipps — Login, betalinger og faste trekk (abonnement). Test live med ekte Vipps, og klon fra GitHub.",
    ),
    githubUrl: env("GITHUB_URL", "https://github.com/aridder/vipps-starter"),
    author: {
      name: env("AUTHOR_NAME", "Asbjørn Riddervold"),
      tagline: env(
        "AUTHOR_TAGLINE",
        "Utvikler med sans for artige idéer og enkle løsninger. Til daglig i Kantega, ellers stadig på jakt etter nye idéer å utforske.",
      ),
      url: env("AUTHOR_URL", "https://www.linkedin.com/in/ariddervold/"),
      email: env("CONTACT_EMAIL", "aridder@pm.me"),
    },
  };
}
