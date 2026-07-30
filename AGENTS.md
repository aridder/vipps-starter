# AGENTS.md

All agent guidance for this repo lives in [CLAUDE.md](CLAUDE.md) — one source of truth,
whichever agent tool you use. It has the fast loop, the architecture map, conventions,
recipes and guardrails.

The most important parts: prefer the **smallest reliable signal first** — `npm run check`
after every edit, `npm run lint` when you touched components, `npm run test:e2e` for UI
changes (screenshots land in `screenshots/`), `npm run verify` as the full gate before
committing. And **do not add app-local Azure deployment scripts** — Azure infrastructure
and production deploys are owned by `app-plattform`.
