#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if ! command -v node >/dev/null 2>&1; then
  echo "Please install Node.js in WSL, then run this script again."
  exit 1
fi
exec node scripts/server.mjs
