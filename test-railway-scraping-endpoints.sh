#!/bin/bash

# Test Railway scraping endpoints
BASE_URL="https://product-explorer-backend-nestjs-production.up.railway.app"

echo "🧪 Testing Railway Scraping Endpoints"
echo "Base URL: $BASE_URL"
echo ""

echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

echo "2. Testing products endpoint..."
curl -s "$BASE_URL/api/products?page=1&limit=3" | jq '.data | length'
echo ""

echo "3. Testing categories endpoint..."
curl -s "$BASE_URL/api/categories?page=1&limit=10" | jq '.data | length'
echo ""

echo "4. Testing scraping stats endpoint..."
response=$(curl -s "$BASE_URL/api/scraping/stats")
echo "Response: $response"
if echo "$response" | jq -e '.statusCode' > /dev/null 2>&1; then
    echo "❌ Stats endpoint failed"
    echo "$response" | jq '.'
else
    echo "✅ Stats endpoint working"
    echo "$response" | jq '.'
fi
echo ""

echo "5. Testing navigation scraping endpoint..."
response=$(curl -s -X POST "$BASE_URL/api/scraping/navigation" \
    -H "Content-Type: application/json" \
    -d '{"baseUrl": "https://www.worldofbooks.com"}')
echo "Response: $response"
if echo "$response" | jq -e '.statusCode' > /dev/null 2>&1; then
    echo "❌ Navigation scraping failed"
    echo "$response" | jq '.'
else
    echo "✅ Navigation scraping working"
    echo "$response" | jq '.'
fi
echo ""

echo "🏁 Test completed"