#!/bin/bash

# Test script for Railway scraping endpoints
BASE_URL="https://product-explorer-backend-nestjs-production.up.railway.app"

echo "🧪 Testing Railway Scraping Endpoints..."
echo "Base URL: $BASE_URL"
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"
echo ""

# Test root endpoint
echo "2. Testing root endpoint..."
curl -s "$BASE_URL/" | jq '.' 2>/dev/null || curl -s "$BASE_URL/"
echo ""

# Test navigation scraping
echo "3. Testing navigation scraping..."
curl -s "$BASE_URL/api/scraping/navigation" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/scraping/navigation"
echo ""

# Test categories scraping (with sample URL)
echo "4. Testing categories scraping..."
curl -s "$BASE_URL/api/scraping/categories?url=https://www.worldofbooks.com/en-gb/category/books" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/scraping/categories?url=https://www.worldofbooks.com/en-gb/category/books"
echo ""

echo "🏁 Test completed"