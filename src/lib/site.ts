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

// Shown as "last updated" on /vilkar and /personvern. Bump when the legal
// text changes materially — section 7 on both pages promises this date is
// accurate.
export const legalUpdated = {
  no: "27. august 2026",
  en: "27 August 2026",
} as const;

const env = (key: string, fallback: string) => {
  const v = process.env[key];
  return v && v.trim() !== "" ? v : fallback;
};

export function resolveSite(): SiteConfig {
  return {
    name: env("APP_NAME", "Vipps Starter"),
    tagline: env(
      "SITE_TAGLINE",
      "Gratis, åpen kildekode (MIT) for Vipps-integrasjon — Login, betaling og faste trekk. Ingenting selges her: demoen tar imot frivillige donasjoner for å vise flyten live. Klon fra GitHub.",
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
