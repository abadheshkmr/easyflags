#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}    Feature Flag Evaluation Engine Test${NC}"
echo -e "${BLUE}=======================================${NC}"

# Base URLs and common headers
API_URL="http://localhost:3000"
# Changed from string to valid UUID format
TENANT_ID="123e4567-e89b-12d3-a456-426614174000"
CONTENT_TYPE="Content-Type: application/json"
TENANT_HEADER="x-tenant-id: $TENANT_ID"

# 1. First let's create a sample feature flag with targeting rules
echo -e "\n${YELLOW}1. Creating test feature flag with targeting rules...${NC}"
curl -s -X POST "$API_URL/feature-flags" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "name": "Test Feature",
    "key": "test-feature",
    "description": "A test feature flag for evaluation engine testing",
    "enabled": true,
    "tenantId": "123e4567-e89b-12d3-a456-426614174000"
  }' | jq .

echo -e "\n${YELLOW}2. Adding targeting rule for premium users...${NC}"
curl -s -X POST "$API_URL/feature-flags/test-feature/targeting-rules" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "name": "Premium Users",
    "description": "Enable for premium users",
    "percentage": 100,
    "enabled": true,
    "conditions": [
      {
        "attribute": "userRole",
        "operator": "EQUALS",
        "value": "premium"
      }
    ]
  }' | jq .

echo -e "\n${YELLOW}3. Adding targeting rule for beta users in US...${NC}"
curl -s -X POST "$API_URL/feature-flags/test-feature/targeting-rules" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "name": "Beta US Users",
    "description": "Enable for 50% of beta users in US",
    "percentage": 50,
    "enabled": true,
    "conditions": [
      {
        "attribute": "userRole",
        "operator": "EQUALS",
        "value": "beta"
      },
      {
        "attribute": "location.country",
        "operator": "EQUALS",
        "value": "US"
      }
    ]
  }' | jq .

# Wait for a moment to ensure all data is saved
echo -e "\n${YELLOW}Waiting for data to be saved...${NC}"
sleep 2

# 4. Test evaluation for a premium user
echo -e "\n${YELLOW}4. Testing evaluation for a premium user...${NC}"
premium_start=$(date +%s%N)
curl -s -X POST "$API_URL/api/v1/evaluate/test-feature" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "userId": "user-123",
    "userRole": "premium",
    "location": {
      "country": "UK"
    }
  }' | jq .
premium_end=$(date +%s%N)
premium_duration=$(( ($premium_end - $premium_start) / 1000000 ))
echo -e "${GREEN}Evaluation duration: ${premium_duration}ms${NC}"

# 5. Test evaluation for a beta user in US (should be affected by percentage rollout)
echo -e "\n${YELLOW}5. Testing evaluation for a beta user in US (subject to 50% rollout)...${NC}"
beta_start=$(date +%s%N)
curl -s -X POST "$API_URL/api/v1/evaluate/test-feature" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "userId": "user-456",
    "userRole": "beta",
    "location": {
      "country": "US"
    }
  }' | jq .
beta_end=$(date +%s%N)
beta_duration=$(( ($beta_end - $beta_start) / 1000000 ))
echo -e "${GREEN}Evaluation duration: ${beta_duration}ms${NC}"

# 6. Test evaluation for a different beta user in US (to show percentage rollout working)
echo -e "\n${YELLOW}6. Testing evaluation for another beta user in US (showing percentage variation)...${NC}"
beta2_start=$(date +%s%N)
curl -s -X POST "$API_URL/api/v1/evaluate/test-feature" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "userId": "user-789",
    "userRole": "beta",
    "location": {
      "country": "US"
    }
  }' | jq .
beta2_end=$(date +%s%N)
beta2_duration=$(( ($beta2_end - $beta2_start) / 1000000 ))
echo -e "${GREEN}Evaluation duration: ${beta2_duration}ms${NC}"

# 7. Test evaluation for a regular user (should get default value)
echo -e "\n${YELLOW}7. Testing evaluation for a regular user (no rule matches)...${NC}"
regular_start=$(date +%s%N)
curl -s -X POST "$API_URL/api/v1/evaluate/test-feature" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "userId": "user-999",
    "userRole": "regular",
    "location": {
      "country": "CA"
    }
  }' | jq .
regular_end=$(date +%s%N)
regular_duration=$(( ($regular_end - $regular_start) / 1000000 ))
echo -e "${GREEN}Evaluation duration: ${regular_duration}ms${NC}"

# 8. Test batch evaluation
echo -e "\n${YELLOW}8. Testing batch evaluation for multiple flags...${NC}"
batch_start=$(date +%s%N)
curl -s -X POST "$API_URL/api/v1/evaluate/batch" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "keys": ["test-feature", "non-existent-feature"],
    "context": {
      "userId": "user-123",
      "userRole": "premium",
      "location": {
        "country": "UK"
      }
    }
  }' | jq .
batch_end=$(date +%s%N)
batch_duration=$(( ($batch_end - $batch_start) / 1000000 ))
echo -e "${GREEN}Batch evaluation duration: ${batch_duration}ms${NC}"

# 9. Test cached evaluation (second request should be faster)
echo -e "\n${YELLOW}9. Testing cached evaluation (second request to same endpoint)...${NC}"
cached_start=$(date +%s%N)
curl -s -X POST "$API_URL/api/v1/evaluate/test-feature" \
  -H "$CONTENT_TYPE" \
  -H "$TENANT_HEADER" \
  -d '{
    "userId": "user-123",
    "userRole": "premium",
    "location": {
      "country": "UK"
    }
  }' | jq .
cached_end=$(date +%s%N)
cached_duration=$(( ($cached_end - $cached_start) / 1000000 ))
echo -e "${GREEN}Cached evaluation duration: ${cached_duration}ms${NC}"
echo -e "${GREEN}Performance improvement: $(( premium_duration - cached_duration ))ms faster${NC}"

echo -e "\n${BLUE}=======================================${NC}"
echo -e "${BLUE}    Evaluation Engine Test Complete${NC}"
echo -e "${BLUE}=======================================${NC}" 