#!/bin/bash

echo "🚀 Railway Startup Script"
echo "Working directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo ""
echo "Files in src directory:"
ls -la src/ 2>/dev/null || echo "No src directory found"

echo ""
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

echo ""
echo "Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "HOST: $HOST"

echo ""
echo "🔍 Attempting to start server..."

# Try different startup methods in order of preference
if [ -f "src/railway-server.js" ]; then
    echo "✅ Found src/railway-server.js, starting..."
    exec node src/railway-server.js
elif [ -f "railway-server.js" ]; then
    echo "✅ Found railway-server.js, starting..."
    exec node railway-server.js
elif npm run start:railway 2>/dev/null; then
    echo "✅ Using npm run start:railway"
    exec npm run start:railway
else
    echo "❌ No suitable startup method found"
    echo "📋 Available files:"
    find . -name "*.js" -type f | head -10
    exit 1
fi