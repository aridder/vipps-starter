#!/usr/bin/env bash
# Idempotent environment setup — safe to run repeatedly.
# Runs on SessionStart (Claude Code) and via `npm run setup`.
# Goal: leave the repo in a state where `npm run check` and the app just work.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 0

log() { printf '  \033[36m▸\033[0m %s\n' "$1"; }

# 1) Dependencies (only if missing — keeps warm sessions fast)
if [ ! -d node_modules ]; then
  log "Installing dependencies…"
  npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund
else
  log "Dependencies present"
fi

# 2) Prisma client (cheap, always safe)
log "Generating Prisma client…"
npx prisma generate >/dev/null 2>&1 || true

# 3) Database — only touch it if a URL is configured and reachable
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -f .env ]; then
  DB_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' || true)"
fi

if [ -n "$DB_URL" ]; then
  if npx --yes prisma migrate status >/dev/null 2>&1; then
    log "Applying migrations + seed…"
    npx prisma migrate deploy >/dev/null 2>&1 || true
    npx prisma db seed >/dev/null 2>&1 || true
    log "Database ready"
  else
    log "DATABASE_URL set but not reachable — run 'npm run db:up' then 'npm run db:reset'"
  fi
else
  log "No DATABASE_URL — copy .env.example to .env (see README)"
fi

log "Setup done. Fast loop: 'npm run check'  ·  full gate: 'npm run verify'"
