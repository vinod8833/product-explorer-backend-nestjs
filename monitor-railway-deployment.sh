#!/bin/bash

# Monitor Railway deployment status
BASE_URL="https://product-explorer-backend-nestjs-production.up.railway.app"

echo "🔍 Monitoring Railway deployment status..."
echo "Base URL: $BASE_URL"
echo ""

for i in {1..10}; do
    echo "Check #$i - $(date)"
    
    # Check health endpoint
    HEALTH_RESPONSE=$(curl -s "$BASE_URL/health" 2>/dev/null)
    
    if echo "$HEALTH_RESPONSE" | grep -q '"database": "connected"'; then
        echo "✅ Database is connected!"
        echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
        break
    elif echo "$HEALTH_RESPONSE" | grep -q '"database": "disconnected"'; then
        echo "⚠️ Database still disconnected (old deployment)"
    elif echo "$HEALTH_RESPONSE" | grep -q '"status": "ok"'; then
        echo "🔄 Deployment responding but checking database status..."
        echo "$HEALTH_RESPONSE" | jq '.database' 2>/dev/null || echo "Database status unknown"
    else
        echo "❌ Deployment not responding or error"
    fi
    
    # Check if scraping endpoints are available
    SCRAPING_RESPONSE=$(curl -s "$BASE_URL/api/scraping/navigation" 2>/dev/null)
    if echo "$SCRAPING_RESPONSE" | grep -q '"success"'; then
        echo "🕷️ Scraping endpoints are live!"
        break
    elif echo "$SCRAPING_RESPONSE" | grep -q '"message": "Scraping API endpoint"'; then
        echo "🔄 Old scraping endpoint (deployment not updated yet)"
    fi
    
    echo "---"
    
    if [ $i -lt 10 ]; then
        sleep 60  # Wait 1 minute between checks
    fi
done

echo ""
echo "🏁 Monitoring completed"