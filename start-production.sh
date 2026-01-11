set -e

echo " Starting Product Explorer Backend in Production Mode"
echo "=================================================="

echo " Validating environment..."
if [ -z "$DATABASE_URL" ]; then
    echo " ERROR: DATABASE_URL is not set"
    exit 1
fi

if [ -z "$NODE_ENV" ]; then
    echo "  WARNING: NODE_ENV is not set, defaulting to production"
    export NODE_ENV=production
fi

echo " Environment: $NODE_ENV"
echo " Node Version: $(node --version)"
echo " NPM Version: $(npm --version)"

echo "🗄️  Checking database connectivity..."
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => {
    console.log(' Database connection successful');
    return client.end();
  })
  .catch(err => {
    console.error(' Database connection failed:', err.message);
    process.exit(1);
  });
" || exit 1


echo " Running database migrations..."
npm run migration:run || {
    echo "⚠️  Migration failed or no migrations to run"
}


echo " Starting NestJS application..."
echo " Health check will be available at: /health"
echo " API docs will be available at: /api/docs"
echo "=================================================="

exec npm run start:prod