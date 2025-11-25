#!/bin/sh
set -e

echo "========================================"
echo "ProprioFinder - Container Startup"
echo "========================================"

# Wait for database to be ready
echo "Waiting for database to be ready..."
max_retries=30
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$queryRaw\`SELECT 1\`.then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch((e) => {
            console.log('Database not ready:', e.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        echo "Database is ready!"
        break
    fi
    
    retry_count=$((retry_count + 1))
    echo "Waiting for database... attempt $retry_count/$max_retries"
    sleep 2
done

if [ $retry_count -eq $max_retries ]; then
    echo "WARNING: Could not connect to database after $max_retries attempts"
    echo "Proceeding anyway - the app may fail if DB is truly unavailable"
fi

# Run Prisma migrations/push
echo "Running Prisma database push..."
if npx prisma db push --skip-generate --accept-data-loss 2>&1; then
    echo "Database schema synchronized successfully!"
else
    echo "WARNING: Prisma db push failed, but continuing..."
    echo "Tables may already exist or there might be a connection issue"
fi

echo "========================================"
echo "Starting ProprioFinder application..."
echo "========================================"

# Start the application
exec node server.js
