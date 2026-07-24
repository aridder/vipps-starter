// Branding & marketing config — all client-safe (NEXT_PUBLIC_*). Set these in
// your hosting env; the defaults below are placeholders. This is the one place
// to rebrand the public landing page and the "hire me" section.

export const site = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Vipps Starter",
  tagline:
    process.env.NEXT_PUBLIC_TAGLINE ??
    "Production-ready Vipps payments for Next.js — clone it and ship.",
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL ??
    "https://github.com/your-org/vipps-starter",
  // The person/company behind this — advertised on the landing page.
  author: {
    name: process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "Your Name",
    tagline:
      process.env.NEXT_PUBLIC_AUTHOR_TAGLINE ??
      "Freelance developer — Vipps, payments and Next.js integrations.",
    url: process.env.NEXT_PUBLIC_AUTHOR_URL ?? "https://your-site.example",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "you@example.com",
  },
};
