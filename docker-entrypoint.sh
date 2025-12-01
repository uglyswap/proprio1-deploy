#!/bin/sh
set -e

echo "========================================"
echo "ProprioFinder - Container Startup"
echo "========================================"
echo "Starting at: $(date)"
echo ""

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Check database connection
max_retries=30
counter=0
until node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('Database connected!');
  process.exit(0);
}).catch(() => process.exit(1));
" 2>/dev/null; do
  counter=$((counter + 1))
  if [ $counter -ge $max_retries ]; then
    echo "ERROR: Could not connect to database after $max_retries attempts"
    echo "Starting anyway, migrations may fail..."
    break
  fi
  echo "Waiting for database... attempt $counter/$max_retries"
  sleep 2
done

# Run Prisma db push to sync schema
echo ""
echo "Running Prisma database push..."

if [ -f "./prisma/schema.prisma" ]; then
    echo "Found Prisma schema, pushing to database..."
    if node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>/dev/null; then
        echo "Database schema synchronized successfully!"
    else
        echo "WARNING: Prisma db push had issues, continuing anyway..."
    fi
else
    echo "WARNING: No Prisma schema found at ./prisma/schema.prisma"
fi

echo ""
echo "========================================"
echo "Starting ProprioFinder application..."
echo "========================================"
echo ""

# Start the application
exec node server.js
