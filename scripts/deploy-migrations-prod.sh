#!/usr/bin/env bash
# Applies pending migrations to PRODUCTION. Reads DIRECT_URL from
# .env.production specifically -- kept separate from the dev .env used
# everywhere else -- so there's no risk of the wrong connection string
# landing here by accident. Delegates the actual migration logic to
# deploy-migrations.sh, which is idempotent and already applies cleanly to
# both an already-migrated database and a genuinely empty one.
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

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL not set in $ENV_FILE" >&2
  exit 1
fi

echo "About to apply pending migrations to PRODUCTION."
read -rp "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

./scripts/deploy-migrations.sh
