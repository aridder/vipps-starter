#!/usr/bin/env bash
# Select the pinned Node major without changing the user's global shell.
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
required="$(tr -d '[:space:]' < "$repo_root/.node-version")"
required_major="${required%%.*}"

node_major() {
  "$1" --version 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/'
}

use_node_home() {
  local node_home="$1"
  shift
  if [ -x "$node_home/bin/node" ] &&
    [ "$(node_major "$node_home/bin/node")" = "$required_major" ]; then
    export PATH="$node_home/bin:$PATH"
    exec "$@"
  fi
}

if command -v node >/dev/null 2>&1 &&
  [ "$(node_major "$(command -v node)")" = "$required_major" ]; then
  exec "$@"
fi

if [ -n "${NODE_22_HOME:-}" ]; then
  use_node_home "$NODE_22_HOME" "$@"
fi

configured_nvm_home="${NVM_BIN:-}"
configured_nvm_home="${configured_nvm_home%/bin}"
for node_home in \
  /opt/homebrew/opt/node@22 \
  /usr/local/opt/node@22 \
  "$configured_nvm_home"; do
  [ -n "$node_home" ] && use_node_home "$node_home" "$@"
done

if command -v mise >/dev/null 2>&1; then
  mise_node_home="$(mise where "node@$required" 2>/dev/null || true)"
  [ -n "$mise_node_home" ] && use_node_home "$mise_node_home" "$@"
fi

for nvm_script in \
  "${NVM_DIR:-$HOME/.nvm}/nvm.sh" \
  "/opt/homebrew/opt/nvm/nvm.sh"; do
  if [ -s "$nvm_script" ]; then
    # shellcheck disable=SC1090
    . "$nvm_script"
    nvm_node="$(nvm which "$required" 2>/dev/null || true)"
    if [ -x "$nvm_node" ] &&
      [ "$(node_major "$nvm_node")" = "$required_major" ]; then
      export PATH="$(dirname "$nvm_node"):$PATH"
      exec "$@"
    fi
  fi
done

cat >&2 <<EOF
Node $required_major is required, but no installed matching runtime was found.
Install it once (for example: brew install node@$required_major) or set
NODE_22_HOME. Then use ./scripts/dev so future runs select it automatically.
EOF
exit 1
