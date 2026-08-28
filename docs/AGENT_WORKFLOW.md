# The fast agent workflow

The single biggest lever for AI-agent productivity is **feedback latency**: how
fast, cheap and reliable the signal is after each edit. This repo is set up so an
agent (or human) gets a strong correctness signal in seconds, and visual
confirmation without a human in the loop.

## Principle: smallest reliable signal first

Escalate only when the cheaper check passes.

```
edit ──▶ npm run check ──▶ npm run lint ──▶ npm run test:e2e ──▶ npm run verify ──▶ commit
        (tsc, ~2–5s)      (touched UI)     (screenshots)        (full gate)
```

- **`npm run check` (`tsc --noEmit`)** is the workhorse. TypeScript's incremental
  build gives a full-project type check in a couple of seconds and catches the
  large majority of agent mistakes (wrong names, shapes, enums, tRPC I/O). Run it
  after *every* change.
- **`npm run lint`** adds React/Next correctness (hooks deps, `<img>`, etc.).
- **`npm run test:e2e`** runs Playwright, which writes PNGs to `screenshots/`.
  An agent can open those images and *see* whether the UI is right — closing the
  loop without waiting for a human.
- **`npm run verify`** (typecheck + lint + build) is the pre-commit gate. Full
  `next build` is ~10s, so it's the last step, not the inner loop.

## Why not just run the build every time?

`next build` is 5–20× slower than `tsc --noEmit` and mostly re-checks the same
types plus bundling you don't need mid-edit. Keeping the inner loop on `check`
means dozens of tight iterations per minute instead of a few.

## Pre-warming: never wait on setup

`scripts/setup.sh` runs via `npm run setup`. It is deliberately not wired to a
checked-in `SessionStart` hook: that would run the setup script of whatever
branch is checked out — a contributor's pull request included — without asking.
Wire it up per machine in `.claude/settings.local.json` (gitignored) if you want
it automatic.

It is idempotent and fast on warm sessions: installs deps only if missing,
regenerates the Prisma client, and applies migrations + seed when a database is
reachable. The agent starts a task with the client generated and the DB in a
known-good, seeded state — no mid-task stalls.

## Deterministic state

- **Seed** creates the default organization; the first login becomes OWNER +
  ADMIN. Same starting point every time → reproducible e2e and manual checks.
- **`npm run db:reset`** returns to that state in one command.
- **Feature flags** let an agent isolate the surface it's working on (e.g. turn
  off `payments` while iterating on the example CRUD).

## Visual verification for UI work

Screenshots are first-class:

- Local: `npm run test:e2e` → `screenshots/01-landing.png`, `02-dashboard.png`,
  `03-items.png`.
- CI: the same screenshots are posted **inline** on the pull request, so a
  reviewer (human or agent) sees the rendered result next to the diff.

Add a screenshot to any new e2e test for a flow you want visible in review.

## Typed, small API surface

Everything client↔server goes through tRPC (`api.<router>.<proc>`). An agent can
reason about the whole API from `src/server/api/routers/*` without reading UI
code, and types flow end-to-end so a wrong call fails at `npm run check` rather
than at runtime.

## Checklist for a change

1. Make the edit.
2. `npm run check` until green.
3. `npm run lint` if you touched components.
4. `npm run test:e2e` for UI/flows; look at the screenshots.
5. `npm run verify` before committing.
6. Open a PR — CI re-runs everything and posts screenshots inline.
