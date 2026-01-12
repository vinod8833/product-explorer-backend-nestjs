.PHONY: help setup start stop restart logs shell clean test build migrate seed status health install copy-env check-deps dev prod-setup info reset-db quick-test docker-logs scrape-data scrape-status demo-scraping test-scraping check-products

help:
	@echo "Product Explorer Backend"
	@echo ""
	@echo " Quick Start:"
	@echo "  make setup    -  Complete setup and start (first time)"
	@echo "  make start    -  Start all services"
	@echo "  make stop     -  Stop all services"
	@echo ""
	@echo " Development:"
	@echo " make logs     -  View application logs"
	@echo " make shell    -  Access backend container"
	@echo " make restart  -  Restart all services"
	@echo " make test     -  Run tests"
	@echo ""
	@echo " Database:"
	@echo "  make migrate  -  Run database migrations"
	@echo "  make seed     -  Seed database with sample data"
	@echo ""
	@echo " Utilities:"
	@echo "  make status   -  Check service status"
	@echo "  make health   -  Check API health"
	@echo "  make clean    -  Clean up everything"
	@echo "  make build    -  Rebuild containers"
	@echo "  make info     -  Show project information"
	@echo ""
	@echo "🕷️ Data Scraping:"
	@echo "  make scrape-data -  Populate database with World of Books data"
	@echo "  make scrape-status -  Check scraping job status"
	@echo "  make check-products -  Check current product count"
	@echo "  make demo-scraping -  Run scraping demo"

setup: check-deps copy-env install start migrate seed
	@echo ""
	@echo " Setup complete! "
	@echo ""
	@echo " Your backend is running at:"
	@echo "    API:          http://localhost:3001"
	@echo "    Health:       http://localhost:3001/health"
	@echo "    API Docs:     http://localhost:3001/api/docs"
	@echo ""
	@echo " Next steps:"
	@echo "   make logs     -  View logs"
	@echo "   make test     -  Run tests"
	@echo "   make stop     -   Stop when done"
	@echo ""
	@echo " Pro tip: Visit http://localhost:3001/api/docs to explore the API!"

check-deps:
	@echo " Checking prerequisites..."
	@command -v docker >/dev/null 2>&1 || { echo " Docker is required but not installed. Visit https://docs.docker.com/get-docker/"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo " Docker Compose is required but not installed."; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo " Node.js is required but not installed. Visit https://nodejs.org/"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo " npm is required but not installed."; exit 1; }
	@echo " All prerequisites found"

copy-env:
	@echo " Setting up environment..."
	@if [ ! -f .env ]; then \
		cp .env.docker .env && \
		sed -i 's/DB_HOST=postgres/DB_HOST=localhost/' .env && \
		sed -i 's/DB_PORT=5432/DB_PORT=5433/' .env && \
		sed -i 's/REDIS_HOST=redis/REDIS_HOST=localhost/' .env && \
		sed -i 's/REDIS_PORT=6379/REDIS_PORT=6380/' .env && \
		sed -i 's/@postgres:5432/@localhost:5433/' .env && \
		sed -i 's/redis:\/\/redis:6379/redis:\/\/localhost:6380/' .env && \
		echo " Environment configured for local development"; \
	else \
		echo " Environment file already exists"; \
	fi

install:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "✅ Dependencies installed"

start: install
	@echo " Starting services..."
	@docker-compose up -d postgres redis
	@echo " Waiting for database to be ready..."
	@sleep 5
	@echo " Starting backend in development mode..."
	@npm run start:dev &
	@echo " Services started"
	@echo " Use 'make logs' to view application logs"

stop:
	@echo " Stopping services..."
	@pkill -f "npm run start:dev" || true
	@pkill -f "nest start" || true
	@docker-compose down
	@echo " Services stopped"

restart: stop start

logs:
	@echo " Showing logs (Press Ctrl+C to exit)..."
	@echo " Tip: Open another terminal and run 'make status' to check service status"
	@docker-compose logs -f postgres redis &
	@sleep 2
	@echo "Backend logs will appear here when running..."

shell:
	@echo " Opening shell..."
	@if docker ps | grep -q product-explorer-backend; then \
		docker exec -it product-explorer-backend-dev sh; \
	else \
		echo " Backend container not running. Use 'make start' first."; \
	fi

migrate:
	@echo " Running database migrations..."
	@npm run migration:run
	@echo " Migrations completed"

seed:
	@echo " Seeding database..."
	@npm run seed
	@echo " Database seeded"

test:
	@echo " Running tests..."
	@npm test

build:
	@echo " Building containers..."
	@docker-compose build
	@echo " Build completed"

# Check service status
status:
	@echo " Service Status:"
	@echo ""
	@docker-compose ps
	@echo ""
	@if pgrep -f "npm run start:dev" > /dev/null; then \
		echo " Backend: Running (PID: $$(pgrep -f 'npm run start:dev'))"; \
	else \
		echo " Backend: Not running"; \
	fi

health:
	@echo " Checking API health..."
	@if curl -s http://localhost:3001/health > /dev/null 2>&1; then \
		echo " API is healthy"; \
		echo " Response: $$(curl -s http://localhost:3001/health | head -1)"; \
	else \
		echo " API is not responding"; \
		echo " Try: make start"; \
	fi

clean:
	@echo " Cleaning up..."
	@make stop
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@rm -rf node_modules dist
	@echo " Cleanup completed"
	@echo " Run 'make setup' to start fresh"

prod-setup:
	@echo " Setting up production environment..."
	@./docker-prod.sh up
	@./docker-prod.sh migrate
	@echo " Production setup completed"

dev: install copy-env
	@echo " Starting development with hot reload..."
	@docker-compose up -d postgres redis
	@sleep 3
	@npm run start:dev

info:
	@echo " Product Explorer Backend"
	@echo ""
	@echo " Repository: https://github.com/vinod8833/product-explorer-backend-nestjs"
	@echo " API: http://localhost:3001"
	@echo " Docs: http://localhost:3001/api/docs"
	@echo " Database: localhost:5433"
	@echo " Redis: localhost:6380"
	@echo ""
	@echo " Quick start: make setup"
	@echo " All commands: make help"
# Reset database with fresh migrations and seed
reset-db:
	@echo "🗄️ Resetting database..."
	@npm run migration:revert || true
	@npm run migration:run
	@npm run seed
	@echo "✅ Database reset completed"

# Quick API health test
quick-test:
	@echo "⚡ Running quick API test..."
	@if curl -s http://localhost:3001/health > /dev/null 2>&1; then \
		echo "✅ API is responding"; \
		curl -s http://localhost:3001/health | head -1; \
	else \
		echo "❌ API is not responding - try 'make start'"; \
	fi

# View Docker container logs only
docker-logs:
	@echo "📋 Docker container logs:"
	@docker-compose logs -f postgres redis

# Populate database with scraped data from World of Books
scrape-data:
	@echo "🕷️ Starting data scraping from World of Books..."
	@echo ""
	@echo "This will populate your database with real product data."
	@echo "The process may take a few minutes..."
	@echo ""
	@echo "📡 Step 1: Triggering navigation scraping..."
	@curl -s -X POST "http://localhost:3001/api/scraping/navigation" \
		-H "Content-Type: application/json" \
		-d '{"baseUrl": "https://www.worldofbooks.com"}' | head -1 || echo "❌ Failed to trigger navigation scraping"
	@sleep 5
	@echo ""
	@echo "📂 Step 2: Triggering category scraping..."
	@curl -s -X POST "http://localhost:3001/api/scraping/categories" \
		-H "Content-Type: application/json" \
		-d '{"categoryUrl": "https://www.worldofbooks.com/en-gb/category/fiction"}' | head -1 || echo "❌ Failed to trigger category scraping"
	@sleep 5
	@echo ""
	@echo "📦 Step 3: Triggering product scraping..."
	@curl -s -X POST "http://localhost:3001/api/scraping/products" \
		-H "Content-Type: application/json" \
		-d '{"productListUrl": "https://www.worldofbooks.com/en-gb/category/fiction", "maxPages": 3}' | head -1 || echo "❌ Failed to trigger product scraping"
	@echo ""
	@echo "✅ Scraping jobs have been queued!"
	@echo ""
	@echo "💡 Monitor progress:"
	@echo "   make scrape-status  - Check scraping job status"
	@echo "   make logs          - View application logs"
	@echo ""
	@echo "🌐 Once complete, your products will be available at:"
	@echo "   http://localhost:3001/api/products"

# Check scraping job status
scrape-status:
	@echo "📊 Scraping Status:"
	@echo ""
	@curl -s "http://localhost:3001/api/scraping/stats" | head -10 || echo "❌ Failed to get scraping stats"
	@echo ""
	@echo "📋 Recent Jobs:"
	@curl -s "http://localhost:3001/api/scraping/jobs?limit=5" | head -20 || echo "❌ Failed to get recent jobs"

# Run the demo scraping script
demo-scraping:
	@echo "🎬 Running scraping demo..."
	@npm run demo:scraping

# Test scraping functionality
test-scraping:
	@echo "🧪 Testing scraping functionality..."
	@npm run test:scraping

# Quick product count check
check-products:
	@echo "📦 Checking product count..."
	@curl -s "http://localhost:3001/api/products?limit=1" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "0"