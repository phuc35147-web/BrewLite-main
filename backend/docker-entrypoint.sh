#!/bin/sh
set -e

echo "==> [Backend] 1/4 Checking and initializing database..."
node init-db.mjs

echo "==> [Backend] 2/4 Running Prisma schema migrations..."
npx prisma migrate deploy

echo "==> [Backend] 3/4 Seeding initial product catalog..."
node seed.mjs

echo "==> [Backend] 4/4 Starting NestJS HTTP server on port 3001..."
exec node dist/main.js
