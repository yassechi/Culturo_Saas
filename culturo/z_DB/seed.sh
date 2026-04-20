#!/bin/sh
set -eu

echo "Waiting for PostgreSQL..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
  sleep 2
done

echo "Waiting for API schema synchronization..."
until [ "$(psql -tAc "SELECT CASE WHEN to_regclass('public.role') IS NOT NULL AND to_regclass('public.user_') IS NOT NULL AND to_regclass('public.board') IS NOT NULL THEN 1 ELSE 0 END")" = "1" ]; do
  sleep 2
done

seed_count="$(psql -tAc 'SELECT COUNT(*) FROM public.role' | tr -d '[:space:]')"

if [ "${seed_count:-0}" != "0" ]; then
  echo "Seed already applied, skipping inserts.sql."
  exit 0
fi

echo "Applying inserts.sql..."
psql -v ON_ERROR_STOP=1 -f /seed/inserts.sql

echo "Seed completed."
