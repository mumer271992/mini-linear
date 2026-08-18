#!/usr/bin/env bash
# Workaround for `prisma migrate dev/deploy` hanging against Supabase's pooler
# from this network. Diffs the last-applied schema snapshot against the current
# schema.prisma (no DB connection needed for that), applies the resulting SQL
# directly via psql, and records it in _prisma_migrations.
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/migrate.sh <migration_name>"
  echo "Example: ./scripts/migrate.sh add_issues_table"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NAME="$1"
SNAPSHOT="prisma/.migration-snapshot.prisma"
TIMESTAMP="$(date -u +%Y%m%d%H%M%S)"
MIGRATION_DIR="prisma/migrations/${TIMESTAMP}_${NAME}"

if [ ! -f "$SNAPSHOT" ]; then
  echo "No snapshot found at $SNAPSHOT — this must be the first run." >&2
  echo "Bootstrap it first with: cp prisma/schema.prisma $SNAPSHOT (only if the DB already matches schema.prisma)" >&2
  exit 1
fi

SQL="$(npx prisma migrate diff \
  --from-schema-datamodel "$SNAPSHOT" \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script)"

if [ -z "$(echo "$SQL" | grep -v '^--' | tr -d '[:space:]')" ]; then
  echo "No schema changes detected — nothing to migrate."
  exit 0
fi

mkdir -p "$MIGRATION_DIR"
echo "$SQL" > "$MIGRATION_DIR/migration.sql"
echo "Generated $MIGRATION_DIR/migration.sql"

set -a
source .env
set +a

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL not set in .env" >&2
  exit 1
fi

echo "Applying migration to database..."
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_DIR/migration.sql"

CHECKSUM="$(shasum -a 256 "$MIGRATION_DIR/migration.sql" | awk '{print $1}')"
MIGRATION_NAME="${TIMESTAMP}_${NAME}"

psql "$DIRECT_URL" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
VALUES (gen_random_uuid()::text, '${CHECKSUM}', now(), '${MIGRATION_NAME}', now(), 1);
SQL

echo "Recorded migration: $MIGRATION_NAME"

cp prisma/schema.prisma "$SNAPSHOT"
npx prisma generate

echo "Done. Migration '$MIGRATION_NAME' applied, snapshot updated, client regenerated."
