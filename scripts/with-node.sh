#!/usr/bin/env bash
# Select the pinned Node major without changing the user's global shell.
# The major comes from .node-version alone, so a runtime bump is one edit.
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

# NODE_<major>_HOME stays supported so a machine can hold several majors.
override_var="NODE_${required_major}_HOME"
override_home="${!override_var:-${NODE_HOME:-}}"
if [ -n "$override_home" ]; then
  use_node_home "$override_home" "$@"
fi

configured_nvm_home="${NVM_BIN:-}"
configured_nvm_home="${configured_nvm_home%/bin}"
for node_home in \
  "/opt/homebrew/opt/node@$required_major" \
  "/usr/local/opt/node@$required_major" \
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

cat >&2 <<MSG
Node $required_major is required, but no installed matching runtime was found.
Install it once (for example: brew install node@$required_major) or set
$override_var. Then use ./scripts/dev so future runs select it automatically.
MSG
exit 1
