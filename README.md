# Product Explorer Backend

A powerful NestJS-based REST API for product data exploration with PostgreSQL, Redis, and intelligent web scraping capabilities.

##  Quick Start (One Command Setup)

**New developers can get the entire backend running with just one command:**

```bash
git clone git@github.com:vinod8833/product-explorer-backend-nestjs.git
cd product-explorer-backend-nestjs
make setup
```

That's it!  The backend will be running at **http://localhost:3001**

> **What happens?** This command automatically installs dependencies, sets up Docker containers for PostgreSQL and Redis, runs database migrations, seeds sample data, and starts the development server.

## 📋 Prerequisites

Before you start, make sure you have these installed:

- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Node.js 18+** - [Install Node.js](https://nodejs.org/) 
- **Git** - [Install Git](https://git-scm.com/)

> **Don't have these?** The `make setup` command will check and guide you if anything is missing.

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `make setup` | **🚀 First-time setup** - installs everything and starts services |
| `make start` | ▶️ Start all services |
| `make stop` | ⏹️ Stop all services |
| `make restart` | 🔄 Restart all services |
| `make logs` | 📋 View application logs |
| `make status` | 📊 Check service status |
| `make health` | 🏥 Check API health |
| `make test` | 🧪 Run tests |
| `make clean` | 🧹 Clean up everything |
| `make scrape-data` | **🕷️ Populate database with scraped data** |
| `make scrape-status` | 📊 Check scraping job status |
| `make check-products` | 📦 Check current product count |

> **Pro tip:** Run `make` without arguments to see all available commands with descriptions.

## 🌐 Access Points

Once running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **API** | http://localhost:3001 | Main API endpoint |
| **Health Check** | http://localhost:3001/health | Service health status |
| **API Documentation** | http://localhost:3001/api/docs | Interactive Swagger docs |
| **Database** | localhost:5433 | PostgreSQL (user: postgres, pass: postgres) |
| **Cache** | localhost:6380 | Redis cache |

> **First time?** Visit the API Documentation to explore all available endpoints interactively!

## 📚 API Endpoints

### 🏠 Core Endpoints
- `GET /health` - Health check and system status
- `GET /api/docs` - Interactive API documentation (Swagger UI)

### 🧭 Navigation
- `GET /api/navigation` - List all navigation items
- `GET /api/navigation/:id` - Get specific navigation item
- `POST /api/navigation` - Create new navigation item

### 📂 Categories  
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get specific category
- `GET /api/categories/navigation/:navigationId` - Get categories by navigation

### 📦 Products
- `GET /api/products` - List products with pagination
- `GET /api/products/:id` - Get specific product details
- `GET /api/products/search?q=term` - Search products by keyword
- `GET /api/products/category/:categoryId` - Get products by category

### 🕷️ Web Scraping
- `GET /api/scraping/jobs` - List all scraping jobs
- `POST /api/scraping/navigation` - Start navigation data scraping
- `POST /api/scraping/categories` - Start category data scraping  
- `POST /api/scraping/products` - Start product data scraping

> **💡 Tip:** Visit http://localhost:3001/api/docs for interactive API testing!

## 🔧 Development

### 🗄️ Database Operations
```bash
make migrate    # Run database migrations
make seed      # Seed with sample data
```

### 🧪 Testing
```bash
make test              # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
```

### 🛠️ Manual Setup (Alternative to `make setup`)
If you prefer to run commands manually:

```bash
# Install dependencies
npm install

# Setup environment
cp .env.docker .env

# Start database services
docker-compose up -d postgres redis

# Run migrations and seed data
npm run migration:run
npm run seed

# Start backend
npm run start:dev
```

## 🏗️ Architecture

This backend is built with modern, scalable technologies:

- **🚀 Framework**: NestJS (Node.js with TypeScript)
- **🗄️ Database**: PostgreSQL with TypeORM
- **⚡ Cache**: Redis for high-performance caching
- **📋 Queue**: Bull Queue for background job processing
- **🕷️ Scraping**: Crawlee with Playwright for web scraping
- **📖 Documentation**: Swagger/OpenAPI
- **🔒 Security**: Helmet, rate limiting, CORS protection
- **📊 Monitoring**: Winston logging with daily rotation

## ⚙️ Environment Configuration

The project uses different environment files for different scenarios:

```bash
.env.example     # Template with all available options
.env.docker      # Docker container configuration  
.env.production  # Production environment settings
```

**Key environment variables (automatically configured by `make setup`):**
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/product_explorer
REDIS_URL=redis://localhost:6380
WOB_BASE_URL=https://www.worldofbooks.com
```

## 🚨 No Data? Let's Fix That!

If your API returns empty results, you need to populate the database with product data. Here's how:

### 🕷️ Quick Data Population

```bash
# Make sure your backend is running first
make start

# Populate database with real World of Books data
make scrape-data
```

This command will:
1. **Scrape navigation** from World of Books homepage
2. **Scrape categories** (starting with Fiction)  
3. **Scrape products** from those categories
4. **Store everything** in your PostgreSQL database

### 📊 Monitor Progress

```bash
# Check scraping job status
make scrape-status

# Check how many products you have
make check-products

# View detailed logs
make logs
```

### 🎬 Alternative: Demo Mode

```bash
# Run interactive scraping demo
make demo-scraping
```

> **Note:** The scraping process respects robots.txt and includes delays to be respectful to the target website.

## 🚨 Troubleshooting

### Common Issues

**Port already in use:**
```bash
make stop
make start
```

**Database connection issues:**
```bash
## 🚨 Troubleshooting

### 🔧 Common Issues

**❌ Port already in use:**
```bash
make stop
make start
```

**❌ Database connection failed:**
```bash
make status          # Check if services are running
docker-compose logs postgres  # Check database logs
make restart         # Restart everything
```

**❌ Permission errors:**
```bash
chmod +x docker-dev.sh docker-prod.sh
sudo chown -R $USER:$USER .
```

**❌ Complete reset (nuclear option):**
```bash
make clean     # Remove everything
make setup     # Start fresh
```

### 🏥 Health Checks
```bash
make health              # Quick health check
curl http://localhost:3001/health    # Manual check
make status             # Detailed service status
```

### 🆘 Need Help?

1. Check `make status` and `make health`
2. View logs with `make logs`
3. Try `make restart` for most issues
4. Use `make clean && make setup` for a fresh start
5. Check [Issues](https://github.com/vinod8833/product-explorer-backend-nestjs/issues) or create a new one

## 🏭 Production Deployment

### Railway Deployment

Your backend is now configured for Railway deployment with a robust, Docker-based approach and **PostgreSQL database connectivity**:

**Database Configuration:**
- ✅ **Railway PostgreSQL**: Connected to Railway-managed PostgreSQL database
- ✅ **SSL Connection**: Secure connection with SSL enabled
- ✅ **Connection Testing**: Automatic database connectivity verification
- ✅ **Health Monitoring**: Database status included in health checks

**Deployment Strategy:**
- Uses `Dockerfile.railway` for optimized Railway deployment
- Primary server: `railway-server.js` with comprehensive logging
- Automatic fallback to `src/railway-server.js` if available
- Enhanced health checks with longer startup time allowance
- **Database connectivity testing on every health check**

**Key Features:**
- ✅ Comprehensive startup logging for debugging
- ✅ Health check endpoint (`/health`) with **database connectivity test**
- ✅ Basic API information (`/`)
- ✅ Product count endpoint (`/api/products`) with **database queries**
- ✅ **PostgreSQL database connectivity** (Railway-managed)
- ✅ Graceful error handling and fallbacks
- ✅ CORS support for frontend integration
- ✅ Non-root user security in Docker container

**Environment Variables (Configured in Railway):**
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:***@centerbeam.proxy.rlwy.net:13082/railway
```

**Deployment Files:**
- `railway.toml` - Railway configuration with database URL
- `Dockerfile.railway` - Optimized Railway Dockerfile
- `railway-server.js` - Main Railway server with database connectivity
- `src/railway-server.js` - Full NestJS server (fallback)

**To Deploy:**
1. Push your changes to GitHub
2. Railway will automatically build using `Dockerfile.railway`
3. Container will start with `node railway-server.js`
4. **Database connection will be established automatically**
5. Health checks will verify `/health` endpoint **including database connectivity**
6. Visit your Railway URL to test endpoints

**Available Endpoints on Railway:**
- `GET /` - API information and local setup instructions
- `GET /health` - **Health check with database status and connection test**
- `GET /api/products` - **Product count from PostgreSQL database**
- `GET /api/scraping` - Scraping information and local setup guide
- `GET /api/*` - Generic API endpoint information

**Database Status:**
- 🗄️ **PostgreSQL 17.7** running on Railway
- 🔒 **SSL-enabled** secure connection
- 📊 **Empty database** ready for data population
- 🔍 **Connection verified** and working

**Debugging Railway Deployment:**
- Check Railway logs for detailed startup information
- Health checks now have 30s start period and 10s timeout
- All requests are logged with timestamps and user agents
- **Database connection attempts are logged in detail**
- Database connectivity is tested on every health check

### Local Development (Full Features)

For complete functionality including scraping and full API:

```bash
git clone git@github.com:vinod8833/product-explorer-backend-nestjs.git
cd product-explorer-backend-nestjs
make setup
make scrape-data
```

### Manual Production Setup

For production deployment on other platforms:

```bash
make prod-setup
```

This uses optimized Docker containers with:
- Multi-stage builds for smaller images
- Security hardening
- Performance optimization
- Health monitoring

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Make** changes and test: `make test`
4. **Commit**: `git commit -am 'Add feature'`
5. **Push**: `git push origin feature-name`
6. **Submit** a Pull Request

## 📁 Project Structure

```
src/
├── modules/          # Feature modules
│   ├── navigation/   # Navigation management
│   ├── category/     # Category management
│   ├── product/      # Product management
│   └── scraping/     # Web scraping
├── common/           # Shared utilities
├── database/         # Database config & migrations
└── scripts/          # Utility scripts
```

## 📄 License

MIT License - see LICENSE file for details.

---

## 💡 Pro Tips for New Developers

- **🚀 First time?** Just run `make setup` and you're ready to go!
- **📅 Daily development?** Use `make start` and `make stop`
- **🔍 API testing?** Visit http://localhost:3001/api/docs for interactive docs
- **🐛 Debugging?** Use `make logs` to see what's happening
- **❓ Stuck?** Run `make` to see all available commands

**Happy coding! 🎉**

---

**Repository**: https://github.com/vinod8833/product-explorer-backend-nestjs