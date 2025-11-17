#!/bin/sh
# Run database migration before starting the server
echo "Running database migration..."
npx prisma db push --skip-generate || echo "Migration failed, continuing anyway..."

# Start the Next.js server directly (not via npm start to avoid loop)
echo "Starting Next.js server..."
exec next start

