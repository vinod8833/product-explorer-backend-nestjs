# Product Explorer Backend

NestJS API with PostgreSQL, Redis, and web scraping capabilities.

## Quick Start

```bash
cp .env.docker .env && ./docker-dev.sh up
```

**Endpoints:**
- API: http://localhost:3001
- Docs: http://localhost:3001/api/docs
- Health: http://localhost:3001/health

## Development

```bash
# Docker (recommended)
./docker-dev.sh up        # Start all services
./docker-dev.sh logs      # View logs
./docker-dev.sh shell     # Access container
./docker-dev.sh clean     # Reset everything

# Local
npm install
npm run start:dev
```

## Production

```bash
./docker-prod.sh up
./docker-prod.sh migrate
```

## Architecture

- **NestJS** - REST API framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Crawlee** - Web scraping engine
- **TypeORM** - Database ORM
- **Bull** - Job queue processing

## Key Scripts

```bash
npm run migration:run     # Apply DB migrations
npm run seed             # Seed initial data
npm test                 # Run test suite
npm run build            # Production build
```

## Environment

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/product_explorer
REDIS_URL=redis://redis:6379
WOB_BASE_URL=https://www.worldofbooks.com
```

## Troubleshooting

```bash
# Port conflicts
lsof -i :3001

# Reset Docker environment
./docker-dev.sh clean && ./docker-dev.sh up

# Check service health
curl http://localhost:3001/health
```