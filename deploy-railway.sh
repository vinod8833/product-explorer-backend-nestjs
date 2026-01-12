#!/bin/bash

echo "🚀 Deploying Product Explorer Backend to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway deploy

echo "✅ Deployment initiated!"
echo ""
echo "🌐 Your application will be available at:"
echo "   https://product-explorer-backend-nestjs-production.up.railway.app"
echo ""
echo "📊 Monitor deployment:"
echo "   railway logs"
echo "   railway status"
echo ""
echo "🏥 Health check:"
echo "   curl https://product-explorer-backend-nestjs-production.up.railway.app/health"