#!/bin/bash

# Monitor Railway deployment for updates
BASE_URL="https://product-explorer-backend-nestjs-production.up.railway.app"

echo "🔍 Monitoring Railway deployment for updates..."
echo "Base URL: $BASE_URL"
echo ""

# Function to check deployment status
check_deployment() {
    local response=$(curl -s "$BASE_URL/health" 2>/dev/null)
    local port=$(echo "$response" | jq -r '.port' 2>/dev/null)
    local database=$(echo "$response" | jq -r '.database' 2>/dev/null)
    
    echo "$(date '+%H:%M:%S') - Port: $port, Database: $database"
    
    # Check if we have the new deployment (port 3001 and database connected)
    if [[ "$port" == "3001" && "$database" != "disconnected" ]]; then
        echo "✅ New deployment detected!"
        echo "Testing scraping endpoints..."
        
        # Test scraping navigation
        echo "🧭 Testing navigation scraping..."
        curl -s "$BASE_URL/api/scraping/navigation" | jq '.success' 2>/dev/null || echo "Endpoint not ready"
        
        return 0
    fi
    
    return 1
}

# Monitor for up to 10 minutes
for i in {1..60}; do
    if check_deployment; then
        echo "🎉 Railway deployment updated successfully!"
        exit 0
    fi
    sleep 10
done

echo "⏰ Monitoring timeout reached. Deployment may still be in progress."