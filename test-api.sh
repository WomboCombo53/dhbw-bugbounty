#!/bin/bash

# Bug Bounty Tracker - Test Script
# This script tests the backend API endpoints

API_URL="https://localhost:3000"
CACERT="./infrastructure/pki/certs/ca.crt"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Bug Bounty Tracker API"
echo "=================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH=$(curl -s --cacert "$CACERT" -o /dev/null -w "%{http_code}" ${API_URL}/health)
if [ $HEALTH -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    curl -s --cacert "$CACERT" ${API_URL}/health | jq .
else
    echo -e "${RED}❌ Health check failed (HTTP $HEALTH)${NC}"
fi
echo ""

# Test 2: Get all bugs (should be empty initially)
echo "2️⃣  Testing GET /api/bugs..."
BUGS=$(curl -s --cacert "$CACERT" -o /dev/null -w "%{http_code}" ${API_URL}/api/bugs)
if [ $BUGS -eq 200 ]; then
    echo -e "${GREEN}✅ GET bugs passed${NC}"
    curl -s --cacert "$CACERT" ${API_URL}/api/bugs | jq '.pagination'
else
    echo -e "${RED}❌ GET bugs failed (HTTP $BUGS)${NC}"
fi
echo ""

# Test 3: Submit a test bug
echo "3️⃣  Testing POST /api/bugs..."
SUBMIT=$(curl -s --cacert "$CACERT" -X POST ${API_URL}/api/bugs \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test SQL Injection Vulnerability",
        "description": "This is a test bug report to verify the API is working correctly. SQL injection found in the login endpoint.",
        "severity": "critical",
        "companyName": "Test Corporation",
        "reporterEmail": "tester@example.com",
        "bountyAmount": 5000
    }')

if echo "$SUBMIT" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ POST bug passed${NC}"
    echo "$SUBMIT" | jq '.data | {id: ._id, title: .title, severity: .severity}'
    BUG_ID=$(echo "$SUBMIT" | jq -r '.data._id')
else
    echo -e "${RED}❌ POST bug failed${NC}"
    echo "$SUBMIT" | jq .
fi
echo ""

# Test 4: Get the created bug by ID
if [ ! -z "$BUG_ID" ]; then
    echo "4️⃣  Testing GET /api/bugs/:id..."
    GET_BUG=$(curl -s --cacert "$CACERT" -o /dev/null -w "%{http_code}" ${API_URL}/api/bugs/${BUG_ID})
    if [ $GET_BUG -eq 200 ]; then
        echo -e "${GREEN}✅ GET bug by ID passed${NC}"
        curl -s --cacert "$CACERT" ${API_URL}/api/bugs/${BUG_ID} | jq '.data | {title: .title, status: .status}'
    else
        echo -e "${RED}❌ GET bug by ID failed (HTTP $GET_BUG)${NC}"
    fi
    echo ""
fi

# Test 5: Update bug status
if [ ! -z "$BUG_ID" ]; then
    echo "5️⃣  Testing PATCH /api/bugs/:id..."
    UPDATE=$(curl -s --cacert "$CACERT" -X PATCH ${API_URL}/api/bugs/${BUG_ID} \
        -H "Content-Type: application/json" \
        -d '{"status": "in-progress"}')
    
    if echo "$UPDATE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✅ PATCH bug passed${NC}"
        echo "$UPDATE" | jq '.data | {title: .title, status: .status}'
    else
        echo -e "${RED}❌ PATCH bug failed${NC}"
        echo "$UPDATE" | jq .
    fi
    echo ""
fi

# Test 6: Get statistics
echo "6️⃣  Testing GET /api/bugs/statistics/summary..."
STATS=$(curl -s --cacert "$CACERT" -o /dev/null -w "%{http_code}" ${API_URL}/api/bugs/statistics/summary)
if [ $STATS -eq 200 ]; then
    echo -e "${GREEN}✅ GET statistics passed${NC}"
    curl -s --cacert "$CACERT" ${API_URL}/api/bugs/statistics/summary | jq '.data'
else
    echo -e "${RED}❌ GET statistics failed (HTTP $STATS)${NC}"
fi
echo ""

# Test 7: Get all bugs again (should have our test bug)
echo "7️⃣  Testing GET /api/bugs (after submission)..."
BUGS_AFTER=$(curl -s --cacert "$CACERT" ${API_URL}/api/bugs)
BUG_COUNT=$(echo "$BUGS_AFTER" | jq '.pagination.total')
if [ $BUG_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ Found $BUG_COUNT bug(s) in database${NC}"
    echo "$BUGS_AFTER" | jq '.data[0] | {title: .title, severity: .severity, status: .status}'
else
    echo -e "${YELLOW}⚠️  No bugs found in database${NC}"
fi
echo ""

# Test 8: Delete test bug (cleanup)
if [ ! -z "$BUG_ID" ]; then
    echo "8️⃣  Cleaning up - DELETE /api/bugs/:id..."
    DELETE=$(curl -s --cacert "$CACERT" -o /dev/null -w "%{http_code}" -X DELETE ${API_URL}/api/bugs/${BUG_ID})
    if [ $DELETE -eq 200 ]; then
        echo -e "${GREEN}✅ DELETE bug passed (cleanup successful)${NC}"
    else
        echo -e "${YELLOW}⚠️  DELETE bug failed (HTTP $DELETE) - manual cleanup may be needed${NC}"
    fi
    echo ""
fi

echo "=================================="
echo "✨ API Testing Complete!"
echo ""
echo "Frontend: https://localhost:8443"
echo "Backend:  https://localhost:3000"
echo "MongoDB:  localhost:27017"
