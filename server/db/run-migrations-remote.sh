#!/bin/bash

# Run each migration file
for file in /app/db/migrations/*.sql; do
  echo "Running migration: $file"
  psql "$DATABASE_URL" -f "$file"
  echo "Completed migration: $file"
done

echo "All migrations completed"
