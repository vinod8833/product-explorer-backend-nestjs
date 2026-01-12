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

### 🚂 Railway Deployment (Live)

**Live URL**: https://product-explorer-backend-nestjs-production.up.railway.app

The application is deployed on Railway with full scraping functionality integrated:

#### Available Endpoints
- **API Documentation**: `/api/docs` - Interactive Swagger UI
- **Health Check**: `/health` - Service status and database connectivity
- **Products API**: `/api/products` - Product listings and search
- **Scraping API**: `/api/scraping/*` - Web scraping endpoints

#### Scraping Endpoints
```bash
# Navigation scraping - Get site navigation structure
GET /api/scraping/navigation

# Category scraping - Scrape category listings
GET /api/scraping/categories?url=<category_url>&maxDepth=3

# Product scraping - Scrape product listings from category pages
GET /api/scraping/products?url=<product_list_url>&maxPages=10

# Product detail scraping - Get detailed product information
GET /api/scraping/product-detail?url=<product_url>
```

#### Testing Railway Deployment
```bash
# Check deployment health and database connectivity
make railway-health

# Test individual scraping endpoints
make railway-scrape-navigation
make railway-scrape-categories  
make railway-scrape-products

# Run comprehensive scraping tests
make test-railway-scraping
```

#### Example Usage
```bash
# Test navigation scraping
curl "https://product-explorer-backend-nestjs-production.up.railway.app/api/scraping/navigation"

# Scrape World of Books categories
curl "https://product-explorer-backend-nestjs-production.up.railway.app/api/scraping/categories?url=https://www.worldofbooks.com/en-gb/category/books"

# Scrape fiction products (limited to 1 page for testing)
curl "https://product-explorer-backend-nestjs-production.up.railway.app/api/scraping/products?url=https://www.worldofbooks.com/en-gb/category/fiction&maxPages=1"
```

**🌐 Live Production URL**: https://product-explorer-backend-nestjs-production.up.railway.app/

Your backend is **successfully deployed** on Railway with a robust, Docker-based approach and **PostgreSQL database connectivity**:

#### 🗄️ Database Configuration
- ✅ **Railway PostgreSQL**: Connected to Railway-managed PostgreSQL database
- ✅ **SSL Connection**: Secure connection with SSL enabled  
- ✅ **Connection Testing**: Automatic database connectivity verification
- ✅ **Health Monitoring**: Database status included in health checks
- 🔗 **Database URL**: `postgresql://postgres:***@centerbeam.proxy.rlwy.net:13082/railway`

#### 🚀 Deployment Architecture
- **Builder**: `Dockerfile.railway` for optimized Railway deployment
- **Primary Server**: `railway-server.js` with comprehensive logging
- **Fallback Strategy**: Automatic fallback to `src/railway-server.js` if available
- **Health Checks**: Enhanced with 30s start period and 10s timeout
- **Database Testing**: Real-time connectivity verification on every health check

#### ✨ Live Features
- ✅ **Comprehensive Logging**: Detailed startup and request logging for debugging
- ✅ **Health Endpoint**: `/health` with **database connectivity test**
- ✅ **API Information**: `/` with setup instructions and repository links
- ✅ **Product Queries**: `/api/products` with **live database queries**
- ✅ **Database Integration**: **PostgreSQL connectivity** (Railway-managed)
- ✅ **Error Handling**: Graceful error handling and informative responses
- ✅ **CORS Support**: Configured for frontend integration
- ✅ **Security**: Non-root user in Docker container

#### 🔧 Environment Variables (Railway)
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway
```

#### 📁 Deployment Files
```
railway.toml           # Railway configuration with database URL
Dockerfile.railway     # Optimized Railway Dockerfile  
railway-server.js      # Main Railway server with database connectivity
src/railway-server.js  # Full NestJS server (fallback)
.env.production        # Production environment variables
```

#### 🌐 Live API Endpoints

**Test these endpoints right now:**

| Endpoint | URL | Description |
|----------|-----|-------------|
| **🏠 Root** | https://product-explorer-backend-nestjs-production.up.railway.app/ | API info & local setup guide |
| **🏥 Health** | https://product-explorer-backend-nestjs-production.up.railway.app/health | Health check + **database status** |
| **📦 Products** | https://product-explorer-backend-nestjs-production.up.railway.app/api/products | **Live product count from PostgreSQL** |
| **🕷️ Scraping** | https://product-explorer-backend-nestjs-production.up.railway.app/api/scraping | Scraping info & local dev guide |

#### � Deplnoyment Process
1. **Push to GitHub** → Automatic Railway deployment trigger
2. **Docker Build** → Uses `Dockerfile.railway` for optimized container
3. **Container Start** → Runs `node railway-server.js`
4. **Database Connect** → **Automatic PostgreSQL connection establishment**
5. **Health Checks** → Verifies `/health` endpoint **including database connectivity**
6. **Live Service** → API available at Railway URL

#### 📊 Current Database Status
- 🗄️ **PostgreSQL 17.7** running on Railway infrastructure
- 🔒 **SSL-enabled** secure connection established
- 📊 **Database State**: Ready for data population
- 🔍 **Connection Status**: ✅ **Verified and working**
- 📈 **Product Count**: Available via `/api/products` endpoint

#### 🛠️ Debugging & Monitoring
- **Railway Logs**: Detailed startup and request logging
- **Health Checks**: 30s start period, 10s timeout, 3 retries
- **Request Logging**: All requests logged with timestamps and user agents
- **Database Monitoring**: Connection attempts logged in detail
- **Error Tracking**: Comprehensive error handling with stack traces

#### 🎯 Testing Your Deployment

**Quick Test Commands:**
```bash
# Test health check with database status
curl https://product-explorer-backend-nestjs-production.up.railway.app/health

# Get API information
curl https://product-explorer-backend-nestjs-production.up.railway.app/

# Check product count from database
curl https://product-explorer-backend-nestjs-production.up.railway.app/api/products
```

**Expected Responses:**
- **Health Check**: JSON with database connection status and server info
- **Root Endpoint**: API information with local development instructions
- **Products**: Product count from PostgreSQL database (currently 0, ready for data)

#### 🚨 Deployment Status: ✅ **LIVE & OPERATIONAL**

Your Railway deployment is **successfully running** with:
- ✅ **Container Built**: Docker image created successfully
- ✅ **Server Started**: Railway server running on port 3001
- ✅ **Database Connected**: PostgreSQL connection established
- ✅ **Health Checks Passing**: `/health` endpoint responding correctly
- ✅ **API Accessible**: All endpoints available and responding
- ✅ **Logging Active**: Comprehensive request and error logging

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