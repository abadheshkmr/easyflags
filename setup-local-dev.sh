#!/bin/bash

# Stop and clean up any existing containers
echo "Stopping any existing containers..."
docker compose -f docker-compose.db.yml down

# Start Redis and PostgreSQL in Docker
echo "Starting Redis and PostgreSQL containers..."
docker compose -f docker-compose.db.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 5

# Verify PostgreSQL is running
echo "Checking PostgreSQL connection..."
if pg_isready -h localhost -p 5432 -U postgres; then
  echo "PostgreSQL is running."
else
  echo "Error: PostgreSQL is not running."
fi

# Verify Redis is running 
echo "Checking Redis connection..."
if redis-cli ping | grep -q "PONG"; then
  echo "Redis is running."
else
  echo "Error: Redis is not running."
fi

# Build the packages locally
echo "Building packages locally..."
yarn install
cd packages/common && yarn build
cd ../server && yarn build

echo "-------------------------------------------------------------------------"
echo "Setup complete! You can now run the API server using:"
echo "cd packages/server && yarn start:local"
echo "-------------------------------------------------------------------------" 