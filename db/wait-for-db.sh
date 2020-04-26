#!/bin/sh
# wait-for-postgres.sh

set -e

cmd="$@"

until PGPASSWORD=$TYPEORM_PASSWORD psql $TYPEORM_DATABASE -h "$TYPEORM_HOST" -U "$TYPEORM_USERNAME" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec $cmd