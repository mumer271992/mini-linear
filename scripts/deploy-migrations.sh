#!/usr/bin/env bash
# Applies every migration in prisma/migrations/ that isn't already recorded in
# _prisma_migrations, in order. Idempotent -- safe to run on every push to
# main, and safe against a genuinely empty database (creates the tracking
# table if missing). Uses psql (simple query protocol) rather than Prisma's
# own engine, since the engine hangs against Supabase's pooler on some
# networks -- see scripts/migrate.sh for the same workaround applied to
# single-migration generation.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL not set" >&2
  exit 1
fi

psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -c '
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);' >/dev/null

for MIGRATION_DIR in prisma/migrations/*/; do
  MIGRATION_NAME="$(basename "$MIGRATION_DIR")"
  SQL_FILE="${MIGRATION_DIR}migration.sql"

  [ -f "$SQL_FILE" ] || continue

  ALREADY_APPLIED="$(psql "$DIRECT_URL" -tAc \
    "SELECT 1 FROM \"_prisma_migrations\" WHERE migration_name = '${MIGRATION_NAME}' AND finished_at IS NOT NULL")"

  if [ "$ALREADY_APPLIED" = "1" ]; then
    echo "Skipping already-applied migration: $MIGRATION_NAME"
    continue
  fi

  echo "Applying migration: $MIGRATION_NAME"
  psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"

  CHECKSUM="$(shasum -a 256 "$SQL_FILE" | awk '{print $1}')"
  psql "$DIRECT_URL" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
VALUES (gen_random_uuid()::text, '${CHECKSUM}', now(), '${MIGRATION_NAME}', now(), 1);
SQL
done

echo "All migrations applied."
