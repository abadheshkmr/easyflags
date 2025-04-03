#!/bin/bash

# Initialize test environment
# This script will initialize the database and seed it with test data
# Usage: ./scripts/initialize-test-env.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}    Feature Flag Service Initializer${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed. Please install it and try again.${NC}"
  exit 1
fi

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking if PostgreSQL is running...${NC}"
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo -e "${RED}PostgreSQL is not running. Please start PostgreSQL and try again.${NC}"
  exit 1
fi

# Check if required packages are installed
echo -e "${YELLOW}Checking for required packages...${NC}"
REQUIRED_PACKAGES=("axios" "pg" "bcrypt")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
  if ! node -e "try { require('$package'); } catch(e) { process.exit(1); }" &> /dev/null; then
    MISSING_PACKAGES+=("$package")
  fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
  echo -e "${YELLOW}Installing missing packages: ${MISSING_PACKAGES[*]}${NC}"
  npm install ${MISSING_PACKAGES[*]} --no-save
fi

# Step 0: Create database if needed
echo -e "\n${YELLOW}Step 0: Creating database if needed...${NC}"
node scripts/create-database.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Database creation failed. Exiting.${NC}"
  exit 1
fi

# Step 1: Create database schema
echo -e "\n${YELLOW}Step 1: Creating database schema...${NC}"
node scripts/create-schema.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Schema creation failed. Exiting.${NC}"
  exit 1
fi

# Step 2: Initialize the database
echo -e "\n${YELLOW}Step 2: Initializing database...${NC}"
node scripts/init-db.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Database initialization failed. Exiting.${NC}"
  exit 1
fi

# Start the server
echo -e "\n${YELLOW}Starting the server in the background...${NC}"
# Save current directory
CURRENT_DIR=$(pwd)

# Check if server is already running
if nc -z localhost 3000 2>/dev/null; then
  echo -e "${YELLOW}Server is already running on port 3000${NC}"
else
  # Start the server (adjust as needed for your project structure)
  echo -e "${YELLOW}Starting the server...${NC}"
  cd packages/server && npm run start:dev &
  SERVER_PID=$!
  echo -e "${GREEN}Server started with PID ${SERVER_PID}${NC}"
  # Move back to original directory
  cd $CURRENT_DIR
  
  # Wait for server to start
  echo -e "${YELLOW}Waiting for server to start...${NC}"
  for i in {1..30}; do
    if nc -z localhost 3000 2>/dev/null; then
      echo -e "${GREEN}Server started successfully!${NC}"
      break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 30 ]; then
      echo -e "${RED}Timed out waiting for server to start.${NC}"
      echo -e "${YELLOW}Continuing anyway, but seeding might fail.${NC}"
    fi
  done
fi

# Step 3: Seed the database with test data
echo -e "\n${YELLOW}Step 3: Seeding database with test data...${NC}"
node scripts/seed-data.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Database seeding failed. Exiting.${NC}"
  exit 1
fi

# Step 4: Generate sample data for SDK testing
echo -e "\n${YELLOW}Step 4: Generating sample data for SDK testing...${NC}"
node scripts/generate-sample-flags.js
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Sample data generation failed. Continuing anyway.${NC}"
fi

echo -e "\n${GREEN}Test environment initialized successfully!${NC}"
echo -e "${GREEN}You can now start the UI to begin testing.${NC}"
echo -e "${BLUE}=======================================${NC}"

# Print login information
echo -e "${YELLOW}Login Information:${NC}"
echo -e "Admin Email: ${GREEN}admin@example.com${NC}"
echo -e "Admin Password: ${GREEN}password123${NC}"

echo -e "\n${YELLOW}Other Test Users:${NC}"
echo -e "Developer Email: ${GREEN}dev@example.com${NC}"
echo -e "Developer Password: ${GREEN}password123${NC}"
echo -e "Viewer Email: ${GREEN}viewer@example.com${NC}"
echo -e "Viewer Password: ${GREEN}password123${NC}"

echo -e "\n${BLUE}=======================================${NC}" 