#!/bin/sh
# Run database migration before starting the server
echo "Running database migration..."
npx prisma db push --skip-generate || echo "Migration failed, continuing anyway..."

# Start the Next.js server
echo "Starting Next.js server..."
exec npm start

