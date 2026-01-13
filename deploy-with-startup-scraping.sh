#!/bin/bash

echo "🚀 Deploying Product Explorer with Startup Scraping to Railway..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

# Deploy to Railway
echo "🚂 Deploying to Railway..."
echo "Environment variables that will be used:"
echo "  - NODE_ENV=production"
echo "  - WOB_BASE_URL=https://www.worldofbooks.com"
echo "  - ENABLE_STARTUP_SCRAPING=true"
echo "  - DATABASE_URL=[Railway PostgreSQL]"
echo ""

# Set environment variables for Railway deployment
export NODE_ENV=production
export ENABLE_STARTUP_SCRAPING=true
export WOB_BASE_URL=https://www.worldofbooks.com

# Deploy using Railway CLI
railway up

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 What happens next:"
    echo "  1. Railway will start the application"
    echo "  2. StartupScrapingService will run on app initialization"
    echo "  3. It will check if database has data"
    echo "  4. If no data exists, it will scrape from World of Books"
    echo "  5. Products will be available via the API"
    echo ""
    echo "🔗 Your application should be available at:"
    echo "   https://product-explorer-backend-nestjs-production.up.railway.app"
    echo ""
    echo "📚 API endpoints:"
    echo "   - Products: /api/products"
    echo "   - Categories: /api/categories"
    echo "   - Navigation: /api/navigation"
    echo "   - Health: /health"
    echo "   - Swagger: /api/docs"
    echo ""
    echo "🧪 Test the deployment:"
    echo "   curl https://product-explorer-backend-nestjs-production.up.railway.app/api/products"
else
    echo "❌ Deployment failed!"
    exit 1
fi