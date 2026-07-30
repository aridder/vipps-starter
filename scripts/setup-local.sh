#!/usr/bin/env bash
# One safe, repeatable local setup. It only migrates the Docker database
# declared in this repository and never overwrites an existing .env.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker with Compose is required. Start Docker Desktop and retry." >&2
  exit 1
fi

docker compose up -d --wait db
local_port="$(docker compose port db 5432 | awk -F: 'END { print $NF }')"
local_database_url="postgresql://app:app@127.0.0.1:${local_port}/app?schema=public"

if [ ! -f .env ]; then
  auth_secret="$(openssl rand -base64 32)"
  {
    printf '# Managed local environment. scripts/setup-local.sh may refresh loopback database ports.\n'
    printf 'NEXT_PUBLIC_APP_NAME="Vipps Starter"\n'
    printf 'APP_NAME="Vipps Starter"\n'
    printf 'DATABASE_URL="%s"\n' "$local_database_url"
    printf 'DATABASE_URL_UNPOOLED="%s"\n' "$local_database_url"
    printf 'AUTH_SECRET="%s"\n' "$auth_secret"
    printf 'ENABLE_DEV_LOGIN="true"\n'
    printf 'ADMIN_EMAILS=""\n'
    printf 'FEATURE_PAYMENTS="false"\n'
    printf 'FEATURE_RECURRING="false"\n'
    printf 'FEATURE_BILLING="false"\n'
    printf 'VIPPS_API_BASE="http://127.0.0.1:9"\n'
    printf 'BILLING_PRODUCT="vipps-starter"\n'
  } > .env
  echo "Created a local-only .env."
else
  configured_database_url="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- || true)"
  configured_database_url="${configured_database_url#\"}"
  configured_database_url="${configured_database_url%\"}"
  configured_database_url="${configured_database_url#\'}"
  configured_database_url="${configured_database_url%\'}"
  if [ "$configured_database_url" = "$local_database_url" ]; then
    :
  elif printf '%s' "$configured_database_url" |
    grep -Eq '^postgresql://app:app@127\.0\.0\.1:[0-9]+/app\?schema=public$'; then
    awk -v url="$local_database_url" '
      /^DATABASE_URL=/ { print "DATABASE_URL=\"" url "\""; next }
      /^DATABASE_URL_UNPOOLED=/ { print "DATABASE_URL_UNPOOLED=\"" url "\""; next }
      { print }
    ' .env > .env.local-port
    mv .env.local-port .env
    echo "Refreshed the managed local database port in .env."
  else
    cat >&2 <<EOF
Refusing to migrate: .env does not point at this repository's local database.

Expected:
  $local_database_url

The existing .env was not changed. Move it aside before running setup again
only if you intend to use this repository-owned local database.
EOF
    exit 1
  fi
fi

dependency_hash="$(shasum -a 256 package-lock.json | awk '{print $1}')"
dependency_stamp="node_modules/.vipps-starter-package-lock-sha"
if [ -x node_modules/.bin/next ] &&
  [ "$(cat "$dependency_stamp" 2>/dev/null || true)" = "$dependency_hash" ]; then
  echo "Dependencies match package-lock.json."
else
  npm ci
  printf '%s\n' "$dependency_hash" > "$dependency_stamp"
fi

export PATH="$PWD/node_modules/.bin:$PATH"

if ! docker compose exec -T db pg_isready -U app -d app >/dev/null 2>&1; then
  echo "The local PostgreSQL database did not become ready." >&2
  exit 1
fi

database_hash="$(
  find prisma -type f -exec shasum -a 256 {} \; |
    sort |
    shasum -a 256 |
    awk '{print $1}'
)"
database_stamp="node_modules/.vipps-starter-database-sha"
has_migrations="$(
  docker compose exec -T db psql -U app -d app -Atqc \
    "select case when to_regclass('public._prisma_migrations') is null then 'no' else 'yes' end"
)"
if [ "$has_migrations" = "yes" ] &&
  [ "$(cat "$database_stamp" 2>/dev/null || true)" = "$database_hash" ]; then
  echo "Database migrations and seed match the repository."
else
  prisma migrate deploy
  prisma db seed
  printf '%s\n' "$database_hash" > "$database_stamp"
fi

cat <<'EOF'

Local setup is ready.

Start the app:
  ./scripts/dev dev

Run the same core gate as CI:
  ./scripts/dev verify
EOF
