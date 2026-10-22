#!/usr/bin/env bash
# Seeds PRODUCTION. Reads DATABASE_URL from .env.production specifically --
# same separation as deploy-migrations-prod.sh, so the dev connection string
# can't land here by accident. Idempotent (upserts), so it's safe to run after
# any change to prisma/seeds/.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE not found -- copy .env.production.example to $ENV_FILE and fill in real production values." >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set in $ENV_FILE" >&2
  exit 1
fi

echo "About to seed PRODUCTION."
read -rp "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

npx tsx prisma/seed.ts

echo "Production seed complete."
