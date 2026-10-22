#!/usr/bin/env bash
# Seeds the DEV database (roles and their permissions) using DATABASE_URL from
# .env. Every seed is an upsert keyed by name, so this is safe to re-run --
# it's also how permission changes in prisma/seeds/ reach an existing DB.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE not found -- copy .env.example to $ENV_FILE and fill in real values." >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set in $ENV_FILE" >&2
  exit 1
fi

npx tsx prisma/seed.ts

echo "Seed complete."
