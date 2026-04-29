#!/usr/bin/env bash
set -euo pipefail

mkdir -p "${REPO_STORAGE_PATH:-/data/repos}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[start] Running drizzle migrations..."
  pnpm drizzle-kit push --force || pnpm drizzle-kit push || {
    echo "[start] drizzle-kit push failed; continuing anyway"
  }
fi

echo "[start] Starting Next.js on :${PORT:-3000}"
exec pnpm next start -p "${PORT:-3000}" -H 0.0.0.0
