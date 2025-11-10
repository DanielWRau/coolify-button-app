#!/bin/bash

# Coolify Deployment Verification Script
# Checks deployment status via Coolify API

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Coolify Deployment Verification"
echo "=================================="
echo ""

# Check if Coolify API credentials are set
if [ -z "$COOLIFY_API_URL" ] || [ -z "$COOLIFY_API_KEY" ]; then
  echo -e "${RED}❌ Coolify API credentials not found in .env${NC}"
  exit 1
fi

echo "✅ Coolify API credentials found"
echo "   URL: $COOLIFY_API_URL"
echo ""

# Function to call Coolify API
call_api() {
  local endpoint=$1
  curl -s -H "Authorization: Bearer $COOLIFY_API_KEY" \
       -H "Content-Type: application/json" \
       "${COOLIFY_API_URL}${endpoint}"
}

# Get server info
echo "📡 Fetching server information..."
SERVER_INFO=$(call_api "/api/v1/servers" 2>&1)

if echo "$SERVER_INFO" | grep -q "error\|unauthorized"; then
  echo -e "${RED}❌ Failed to connect to Coolify API${NC}"
  echo "   Response: $SERVER_INFO"
  exit 1
fi

echo -e "${GREEN}✅ Connected to Coolify API${NC}"
echo ""

# Get applications
echo "📦 Fetching application status..."
APP_INFO=$(call_api "/api/v1/applications" 2>&1)

if echo "$APP_INFO" | grep -q "error"; then
  echo -e "${RED}❌ Failed to fetch applications${NC}"
  echo "   Response: $APP_INFO"
  exit 1
fi

# Parse application info (basic JSON parsing)
if echo "$APP_INFO" | grep -q "coolify-button-app"; then
  echo -e "${GREEN}✅ Application found: coolify-button-app${NC}"

  # Extract status if available
  STATUS=$(echo "$APP_INFO" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  if [ ! -z "$STATUS" ]; then
    echo "   Status: $STATUS"
  fi

  # Extract URL if available
  URL=$(echo "$APP_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
  if [ ! -z "$URL" ]; then
    echo "   URL: $URL"
  fi
else
  echo -e "${YELLOW}⚠️  Application 'coolify-button-app' not found in API response${NC}"
fi

echo ""
echo "🏥 Health Check..."

# Check if the application is accessible
if [ ! -z "$URL" ]; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>&1)
  if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Application is accessible (HTTP $HTTP_STATUS)${NC}"
  else
    echo -e "${YELLOW}⚠️  Application returned HTTP $HTTP_STATUS${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No URL available for health check${NC}"
fi

echo ""
echo "=================================="
echo "✨ Verification complete"
