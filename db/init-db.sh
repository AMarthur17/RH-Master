#!/bin/sh
set -e

# wait until Postgres is ready
until pg_isready -h db -p 5432 -U postgres; do
  sleep 1
done

# run the init SQL (idempotent). If it fails, exit 0 so service doesn't error out hard.
PGPASSWORD=postgres psql -h db -U postgres -d rh_master -f /docker-entrypoint-initdb.d/init.sql || true
