#!/usr/bin/env bash
# Applies pending migrations to the DEV database, using DIRECT_URL from .env.
# The local counterpart of deploy-migrations-prod.sh: use it when migrations
# already exist as folders (pulled from git, or written by hand) rather than
# being generated from a schema change -- that's what migrate.sh is for.
# Regenerates the Prisma client afterwards so the code sees any new columns.
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

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL not set in $ENV_FILE" >&2
  exit 1
fi

./scripts/deploy-migrations.sh

npx prisma generate

echo "Done. Local database is up to date and the Prisma client is regenerated."
