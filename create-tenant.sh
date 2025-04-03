#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Define the UUID to use
TENANT_ID="123e4567-e89b-12d3-a456-426614174000"

# URL for tenant creation
API_URL="http://localhost:3000"

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}    Creating Test Tenant${NC}"
echo -e "${BLUE}=======================================${NC}"

# Create tenant
echo -e "\n${YELLOW}Creating tenant with ID: ${TENANT_ID}${NC}"
curl -s -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"${TENANT_ID}\",
    \"name\": \"Test Tenant\", 
    \"description\": \"Tenant for testing the evaluation engine\"
  }" | jq .

echo -e "\n${GREEN}Tenant creation complete. Now you can run the evaluation tests.${NC}" 