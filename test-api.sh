#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:3000"
ACCESS_TOKEN=""
TENANT_ID=""

# Create a temp file for storing data
TEST_DATA_FILE=$(mktemp)

# Print section header
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}[✓] $2${NC}"
  else
    echo -e "${RED}[✗] $2${NC}"
    echo -e "${YELLOW}Error: $3${NC}"
  fi
}

# =========================================================
# AUTHENTICATION TESTS
# =========================================================

print_header "Testing Authentication Endpoints"

# Test 1: Register a new user
echo -e "${YELLOW}Test 1: Register a new user${NC}"
USER_EMAIL="test.user$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"Password123!\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"role\": \"admin\"
  }")

echo "Response: $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
  print_result 0 "User registration successful"
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//g' | sed 's/"//g')
  echo "Access Token: ${ACCESS_TOKEN:0:15}..." # Show only the beginning of the token
else
  print_result 1 "User registration failed" "$REGISTER_RESPONSE"
fi

# Test 2: Try to register the same user again (should fail)
echo -e "\n${YELLOW}Test 2: Register the same user again (should fail)${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"Password123!\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"role\": \"admin\"
  }")

echo "Response: $DUPLICATE_RESPONSE"

if echo "$DUPLICATE_RESPONSE" | grep -q "exists"; then
  print_result 0 "Duplicate user detection works correctly"
else
  print_result 1 "Duplicate user test failed" "$DUPLICATE_RESPONSE"
fi

# Test 3: Login with the created user
echo -e "\n${YELLOW}Test 3: Login with the created user${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"Password123!\"
  }")

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  print_result 0 "User login successful"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//g' | sed 's/"//g')
  echo "Access Token: ${ACCESS_TOKEN:0:15}..." # Show only the beginning of the token
else
  print_result 1 "User login failed" "$LOGIN_RESPONSE"
fi

# Test 4: Login with wrong password
echo -e "\n${YELLOW}Test 4: Login with wrong password (should fail)${NC}"
WRONG_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"WrongPassword123!\"
  }")

echo "Response: $WRONG_LOGIN_RESPONSE"

if echo "$WRONG_LOGIN_RESPONSE" | grep -q "Unauthorized" || echo "$WRONG_LOGIN_RESPONSE" | grep -q "Invalid credentials"; then
  print_result 0 "Invalid credentials detection works correctly"
else
  print_result 1 "Wrong password test failed" "$WRONG_LOGIN_RESPONSE"
fi

# =========================================================
# TENANT TESTS
# =========================================================

print_header "Testing Tenant Endpoints"

# Test 5: Create a new tenant
echo -e "${YELLOW}Test 5: Create a new tenant${NC}"
TENANT_RESPONSE=$(curl -s -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"name\": \"Test Tenant $(date +%s)\",
    \"description\": \"A test tenant for API testing\"
  }")

echo "Response: $TENANT_RESPONSE"

if echo "$TENANT_RESPONSE" | grep -q "id"; then
  print_result 0 "Tenant creation successful"
  TENANT_ID=$(echo "$TENANT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//g' | sed 's/"//g')
  echo "Tenant ID: $TENANT_ID"
else
  print_result 1 "Tenant creation failed" "$TENANT_RESPONSE"
fi

# Test 6: Get all tenants
echo -e "\n${YELLOW}Test 6: Get all tenants${NC}"
TENANTS_RESPONSE=$(curl -s -X GET "$API_URL/tenants" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $TENANTS_RESPONSE"

if echo "$TENANTS_RESPONSE" | grep -q "\[" && echo "$TENANTS_RESPONSE" | grep -q "\]"; then
  print_result 0 "Fetching all tenants successful"
else
  print_result 1 "Fetching all tenants failed" "$TENANTS_RESPONSE"
fi

# Test 7: Get tenant by ID
echo -e "\n${YELLOW}Test 7: Get tenant by ID${NC}"
TENANT_GET_RESPONSE=$(curl -s -X GET "$API_URL/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $TENANT_GET_RESPONSE"

if echo "$TENANT_GET_RESPONSE" | grep -q "id"; then
  print_result 0 "Fetching tenant by ID successful"
else
  print_result 1 "Fetching tenant by ID failed" "$TENANT_GET_RESPONSE"
fi

# =========================================================
# FEATURE FLAG TESTS
# =========================================================

print_header "Testing Feature Flag Endpoints"

# Test 8: Create a new feature flag
echo -e "${YELLOW}Test 8: Create a new feature flag${NC}"
FLAG_KEY="test-flag-$(date +%s)"
FLAG_RESPONSE=$(curl -s -X POST "$API_URL/feature-flags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"key\": \"$FLAG_KEY\",
    \"name\": \"Test Flag\",
    \"description\": \"A test feature flag\",
    \"tenantId\": \"$TENANT_ID\",
    \"enabled\": true
  }")

echo "Response: $FLAG_RESPONSE"

if echo "$FLAG_RESPONSE" | grep -q "id"; then
  print_result 0 "Feature flag creation successful"
  FLAG_ID=$(echo "$FLAG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//g' | sed 's/"//g')
  echo "Flag ID: $FLAG_ID"
else
  print_result 1 "Feature flag creation failed" "$FLAG_RESPONSE"
fi

# Test 9: Get all feature flags for a tenant
echo -e "\n${YELLOW}Test 9: Get all feature flags for a tenant${NC}"
FLAGS_RESPONSE=$(curl -s -X GET "$API_URL/feature-flags?tenantId=$TENANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $FLAGS_RESPONSE"

if echo "$FLAGS_RESPONSE" | grep -q "\[" && echo "$FLAGS_RESPONSE" | grep -q "\]"; then
  print_result 0 "Fetching all feature flags successful"
else
  print_result 1 "Fetching all feature flags failed" "$FLAGS_RESPONSE"
fi

# Test 10: Get feature flag by ID
echo -e "\n${YELLOW}Test 10: Get feature flag by ID${NC}"
FLAG_GET_RESPONSE=$(curl -s -X GET "$API_URL/feature-flags/$FLAG_ID?tenantId=$TENANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $FLAG_GET_RESPONSE"

if echo "$FLAG_GET_RESPONSE" | grep -q "id"; then
  print_result 0 "Fetching feature flag by ID successful"
else
  print_result 1 "Fetching feature flag by ID failed" "$FLAG_GET_RESPONSE"
fi

# Test 11: Get feature flag by key
echo -e "\n${YELLOW}Test 11: Get feature flag by key${NC}"
FLAG_KEY_RESPONSE=$(curl -s -X GET "$API_URL/feature-flags/key/$FLAG_KEY?tenantId=$TENANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $FLAG_KEY_RESPONSE"

if echo "$FLAG_KEY_RESPONSE" | grep -q "id"; then
  print_result 0 "Fetching feature flag by key successful"
else
  print_result 1 "Fetching feature flag by key failed" "$FLAG_KEY_RESPONSE"
fi

# Test 12: Update a feature flag
echo -e "\n${YELLOW}Test 12: Update a feature flag${NC}"
FLAG_UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/feature-flags/$FLAG_ID?tenantId=$TENANT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"name\": \"Updated Test Flag\",
    \"description\": \"An updated test feature flag\",
    \"enabled\": false
  }")

echo "Response: $FLAG_UPDATE_RESPONSE"

if echo "$FLAG_UPDATE_RESPONSE" | grep -q "id"; then
  print_result 0 "Feature flag update successful"
else
  print_result 1 "Feature flag update failed" "$FLAG_UPDATE_RESPONSE"
fi

# =========================================================
# CLEANUP
# =========================================================

print_header "Cleanup"

# Test 13: Delete the feature flag
echo -e "${YELLOW}Test 13: Delete the feature flag${NC}"
FLAG_DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/feature-flags/$FLAG_ID?tenantId=$TENANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $FLAG_DELETE_RESPONSE"

if [ -z "$FLAG_DELETE_RESPONSE" ] || echo "$FLAG_DELETE_RESPONSE" | grep -q "{}"; then
  print_result 0 "Feature flag deletion successful"
else
  print_result 1 "Feature flag deletion failed" "$FLAG_DELETE_RESPONSE"
fi

# Test 14: Delete the tenant
echo -e "\n${YELLOW}Test 14: Delete the tenant${NC}"
TENANT_DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $TENANT_DELETE_RESPONSE"

if [ -z "$TENANT_DELETE_RESPONSE" ] || echo "$TENANT_DELETE_RESPONSE" | grep -q "{}"; then
  print_result 0 "Tenant deletion successful"
else
  print_result 1 "Tenant deletion failed" "$TENANT_DELETE_RESPONSE"
fi

# =========================================================
# SUMMARY
# =========================================================

print_header "Test Summary"
echo -e "Tested against API at: ${YELLOW}$API_URL${NC}"
echo -e "Created and tested user: ${YELLOW}$USER_EMAIL${NC}"
echo -e "Created and tested tenant ID: ${YELLOW}$TENANT_ID${NC}"
echo -e "Created and tested feature flag key: ${YELLOW}$FLAG_KEY${NC}"

# Clean up temp file
rm -f "$TEST_DATA_FILE"

echo -e "\n${GREEN}Tests completed!${NC}" 