# Product Explorer Backend

A NestJS-based backend API for the Product Explorer application with PostgreSQL database, Redis caching, and web scraping capabilities.

## 🚀 Quick Start

Run the entire backend with a single command:

```bash
./docker-dev.sh up
```

This command will:
-  Start PostgreSQL database
-  Start Redis cache
-  Build and start the NestJS backend
-  Set up all dependencies automatically
-  Apply database migrations
-  Make the API available at http://localhost:3001

##  Prerequisites

- Docker and Docker Compose
- Git

## 🛠️ Setup & Installation

### Option 1: Docker (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd product-explorer-backend-nestjs
   cp .env.docker .env
   ```

2. **Start everything:**
   ```bash
   ./docker-dev.sh up
   ```

3. **Access the application:**
   - API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs
   - Health Check: http://localhost:3001/health

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local database settings
   ```

3. **Start services:**
   ```bash
   # Start PostgreSQL and Redis (using Docker)
   docker-compose up -d postgres redis
   
   # Start the backend
   npm run start:dev
   ```

## 🐳 Docker Commands

| Command | Description |
|---------|-------------|
| `./docker-dev.sh up` | Start all services (development) |
| `./docker-dev.sh down` | Stop all services |
| `./docker-dev.sh logs` | View all logs |
| `./docker-dev.sh backend` | View backend logs only |
| `./docker-dev.sh status` | Check service status |
| `./docker-dev.sh shell` | Access backend container |
| `./docker-dev.sh clean` | Remove containers and volumes |
| `./docker-dev.sh build` | Rebuild images |

### Production Commands

| Command | Description |
|---------|-------------|
| `./docker-prod.sh up` | Start production environment |
| `./docker-prod.sh migrate` | Run database migrations |
| `./docker-prod.sh seed` | Seed database with initial data |

## 📊 Services

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3001 | NestJS application |
| PostgreSQL | 5433 | Database |
| Redis | 6380 | Cache & sessions |

## 🔧 Development

### Available Scripts

```bash
npm run start:dev      # Start with hot reload
npm run start:prod     # Start production build
npm run build          # Build the application
npm run test           # Run tests
npm run lint           # Lint code
npm run migration:run  # Run database migrations
npm run seed           # Seed database
```

### Database Operations

```bash
# Using Docker
./docker-dev.sh shell
npm run migration:run
npm run seed

# Local development
npm run migration:run
npm run seed
```

## 🌐 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/docs` - Swagger documentation

### Navigation
- `GET /api/navigation` - Get all navigation items
- `GET /api/navigation/:id` - Get navigation by ID
- `POST /api/navigation` - Create navigation item

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/navigation/:navigationId` - Get categories by navigation

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/search` - Search products
- `GET /api/products/category/:categoryId` - Get products by category

### Scraping
- `GET /api/scraping/jobs` - Get scraping jobs
- `POST /api/scraping/navigation` - Scrape navigation
- `POST /api/scraping/categories` - Scrape categories
- `POST /api/scraping/products` - Scrape products

## 🔒 Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/product_explorer
REDIS_URL=redis://localhost:6379
WOB_BASE_URL=https://www.worldofbooks.com
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   Port: 6379    │
                       └─────────────────┘
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 📝 Logging

Logs are available through Docker commands:

```bash
# All services
./docker-dev.sh logs

# Backend only
./docker-dev.sh backend

# Follow logs in real-time
./docker-dev.sh logs -f
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the ports
   lsof -i :3001
   lsof -i :5432
   lsof -i :6379
   ```

2. **Database connection issues:**
   ```bash
   # Check database logs
   ./docker-dev.sh db
   
   # Restart services
   ./docker-dev.sh restart
   ```

3. **Permission issues:**
   ```bash
   # Fix script permissions
   chmod +x docker-dev.sh docker-prod.sh
   ```

4. **Clean start:**
   ```bash
   # Remove everything and start fresh
   ./docker-dev.sh clean
   ./docker-dev.sh up
   ```

### Health Checks

```bash
# Check if services are running
curl http://localhost:3001/health

# Check API documentation
curl http://localhost:3001/api/docs
```

## 📚 Documentation

- [Docker Setup Guide](DOCKER.md) - Detailed Docker configuration
- [API Documentation](http://localhost:3001/api/docs) - Interactive Swagger docs (when running)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Check the [troubleshooting section](#-troubleshooting) or review the logs with `./docker-dev.sh logs`.