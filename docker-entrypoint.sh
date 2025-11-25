#!/bin/sh
set -e

echo "========================================"
echo "ProprioFinder - Container Startup"
echo "========================================"
echo "Starting at: $(date)"
echo ""

# Simple wait for database - give it time to be ready
echo "Waiting 10 seconds for database to be ready..."
sleep 10

# Run Prisma db push to sync schema
echo "Running Prisma database push..."
cd /app

# Check if prisma schema exists
if [ -f "./prisma/schema.prisma" ]; then
    echo "Found Prisma schema, pushing to database..."
    # Use node_modules/.bin/prisma instead of npx
    if ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss; then
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
