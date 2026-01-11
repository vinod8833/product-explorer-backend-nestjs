#!/bin/bash

set -e

echo " Starting backend deployment..."

echo " Installing dependencies..."
npm ci --only=production

echo " Building application..."
npm run build

echo " Running database migrations..."
npm run migration:run || echo " Migration failed or no migrations to run"

echo " Starting application..."
exec npm run start:prod