#!/bin/bash

# Railway deployment script with environment variable setup
echo "🚂 Railway Deployment Script"
echo "Setting up environment variables..."

# Set Railway environment variables
export NODE_ENV=production
export PORT=3001
export HOST=0.0.0.0
export DATABASE_URL="postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway"
export ENABLE_SWAGGER=true
export WOB_BASE_URL="https://www.worldofbooks.com"
export SCRAPING_DELAY_MIN=1000
export SCRAPING_DELAY_MAX=3000
export SCRAPING_MAX_RETRIES=3
export SCRAPING_TIMEOUT=30000
export SCRAPING_RESPECT_ROBOTS=true

echo "✅ Environment variables set"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"

# Start the railway server
echo "🚀 Starting Railway server..."
node railway-server.js