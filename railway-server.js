// Railway deployment server - Full NestJS Application with Scraping Integration v2.0
// This file starts the complete NestJS application with Swagger API docs and scraping endpoints

const path = require('path');
const fs = require('fs');
const express = require('express');
const { Client } = require('pg');

console.log('🚀 Starting Railway Production Server - Full NestJS Application with Scraping...');
console.log('Working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 3001);
console.log('Host:', process.env.HOST || '0.0.0.0');

// Ensure DATABASE_URL is set for Railway deployment
if (!process.env.DATABASE_URL) {
  console.log('⚠️ DATABASE_URL not found in environment, setting Railway PostgreSQL URL...');
  process.env.DATABASE_URL = 'postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway';
}
console.log('Database URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');

// List files to debug
console.log('Files in current directory:');
try {
  const files = fs.readdirSync('.');
  files.slice(0, 15).forEach(file => console.log(`  - ${file}`));
  
  if (fs.existsSync('dist')) {
    console.log('Files in dist directory:');
    const distFiles = fs.readdirSync('dist');
    distFiles.forEach(file => console.log(`  - dist/${file}`));
  }
} catch (error) {
  console.log('Could not list files:', error.message);
}

// Set production environment and ensure DATABASE_URL is available
process.env.NODE_ENV = 'production';
if (!process.env.DATABASE_URL) {
  console.log('⚠️ DATABASE_URL not found in environment, setting Railway PostgreSQL URL...');
  process.env.DATABASE_URL = 'postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway';
}

// Database connection test
async function testDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️ No DATABASE_URL provided');
    return false;
  }

  try {
    console.log('🔍 Testing database connection...');
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    
    const result = await client.query('SELECT version()');
    console.log('✅ Database connected successfully');
    console.log('📊 Database version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Scraping service configuration
const scrapingConfig = {
  WOB_BASE_URL: 'https://www.worldofbooks.com',
  WOB_USER_AGENT: 'Mozilla/5.0 (compatible; ProductExplorer/1.0)',
  SCRAPING_DELAY_MIN: 1000,
  SCRAPING_DELAY_MAX: 3000,
  SCRAPING_MAX_RETRIES: 3,
  SCRAPING_TIMEOUT: 30000,
  SCRAPING_RESPECT_ROBOTS: true,
  SCRAPING_PROXY_URLS: ''
};

// Simple config service for scraping
class SimpleConfigService {
  get(key, defaultValue) {
    return process.env[key] || scrapingConfig[key] || defaultValue;
  }
}

// Initialize scraping service
let scrapingService = null;

async function initializeScrapingService() {
  try {
    console.log('🔧 Initializing scraping service...');
    
    // Try to load the scraping service from built files
    const scrapingServicePaths = [
      path.join(__dirname, 'dist', 'modules', 'scraping', 'world-of-books-scraper.service.js'),
      path.join(__dirname, 'src', 'modules', 'scraping', 'world-of-books-scraper.service.ts')
    ];
    
    for (const servicePath of scrapingServicePaths) {
      if (fs.existsSync(servicePath)) {
        console.log(`📦 Found scraping service at: ${servicePath}`);
        
        if (servicePath.endsWith('.ts')) {
          // For TypeScript files, we need ts-node
          require('ts-node/register');
          require('tsconfig-paths/register');
        }
        
        const { WorldOfBooksScraperService } = require(servicePath);
        const configService = new SimpleConfigService();
        scrapingService = new WorldOfBooksScraperService(configService);
        
        console.log('✅ Scraping service initialized successfully');
        return true;
      }
    }
    
    console.log('⚠️ Scraping service files not found, scraping endpoints will be disabled');
    return false;
  } catch (error) {
    console.error('❌ Failed to initialize scraping service:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Create fallback Express server with scraping endpoints
function createFallbackServer() {
  console.log('🔄 Creating fallback Express server with scraping endpoints...');
  
  const app = express();
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Railway Production Server',
      scraping: scrapingService ? 'enabled' : 'disabled'
    });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Product Explorer Backend - Railway Production',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        scraping: scrapingService ? {
          navigation: '/api/scraping/navigation',
          categories: '/api/scraping/categories',
          products: '/api/scraping/products',
          productDetail: '/api/scraping/product-detail'
        } : 'disabled'
      }
    });
  });
  
  // Scraping endpoints (only if scraping service is available)
  if (scrapingService) {
    console.log('🕷️ Adding scraping endpoints...');
    
    // Scrape navigation
    app.get('/api/scraping/navigation', async (req, res) => {
      try {
        console.log('🔍 Starting navigation scraping...');
        const results = await scrapingService.scrapeNavigation();
        console.log(`✅ Navigation scraping completed: ${results.length} items`);
        res.json({
          success: true,
          count: results.length,
          data: results,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Navigation scraping failed:', error.message);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Scrape categories
    app.get('/api/scraping/categories', async (req, res) => {
      try {
        const { url, maxDepth = 3 } = req.query;
        if (!url) {
          return res.status(400).json({
            success: false,
            error: 'URL parameter is required',
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`🔍 Starting category scraping from: ${url}`);
        const results = await scrapingService.scrapeCategories(url, parseInt(maxDepth));
        console.log(`✅ Category scraping completed: ${results.length} items`);
        res.json({
          success: true,
          count: results.length,
          data: results,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Category scraping failed:', error.message);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Scrape products
    app.get('/api/scraping/products', async (req, res) => {
      try {
        const { url, maxPages = 10 } = req.query;
        if (!url) {
          return res.status(400).json({
            success: false,
            error: 'URL parameter is required',
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`🔍 Starting product scraping from: ${url}`);
        const results = await scrapingService.scrapeProducts(url, parseInt(maxPages));
        console.log(`✅ Product scraping completed: ${results.length} items`);
        res.json({
          success: true,
          count: results.length,
          data: results,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Product scraping failed:', error.message);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Scrape product detail
    app.get('/api/scraping/product-detail', async (req, res) => {
      try {
        const { url } = req.query;
        if (!url) {
          return res.status(400).json({
            success: false,
            error: 'URL parameter is required',
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`🔍 Starting product detail scraping from: ${url}`);
        const result = await scrapingService.scrapeProductDetail(url);
        console.log(`✅ Product detail scraping completed: ${result.title}`);
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Product detail scraping failed:', error.message);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
  
  // Start server
  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  
  app.listen(port, host, () => {
    console.log(`🚀 Fallback server running on ${host}:${port}`);
    console.log(`📚 Available endpoints:`);
    console.log(`  - Health: http://${host}:${port}/health`);
    console.log(`  - Root: http://${host}:${port}/`);
    if (scrapingService) {
      console.log(`  - Navigation: http://${host}:${port}/api/scraping/navigation`);
      console.log(`  - Categories: http://${host}:${port}/api/scraping/categories?url=<category_url>`);
      console.log(`  - Products: http://${host}:${port}/api/scraping/products?url=<product_list_url>`);
      console.log(`  - Product Detail: http://${host}:${port}/api/scraping/product-detail?url=<product_url>`);
    }
  });
}

// Main initialization
async function main() {
  // Test database connection
  await testDatabaseConnection();
  
  // Initialize scraping service
  await initializeScrapingService();
  
  // Try to load NestJS applications in order of preference
  const appPaths = [
    { path: path.join(__dirname, 'dist', 'main-production.js'), name: 'Production App' },
    { path: path.join(__dirname, 'dist', 'main.js'), name: 'Main App' }
  ];

  let appStarted = false;

  for (const app of appPaths) {
    console.log(`Looking for ${app.name} at: ${app.path}`);
    
    if (fs.existsSync(app.path)) {
      console.log(`✅ Found ${app.name}, starting application...`);
      console.log('🎯 This will include Swagger API docs at /api/docs');
      console.log('📚 Full REST API with all endpoints will be available');
      
      try {
        // Load and start the NestJS application
        require(app.path);
        console.log(`✅ ${app.name} loaded successfully`);
        console.log('📚 Swagger API docs should be available at: /api/docs');
        appStarted = true;
        break;
      } catch (error) {
        console.error(`❌ Failed to load ${app.name}:`, error.message);
        console.error('Stack trace:', error.stack);
        console.log(`🔄 Trying next application...`);
      }
    } else {
      console.log(`⚠️ ${app.name} not found at ${app.path}`);
    }
  }

  if (!appStarted) {
    console.log('🔄 NestJS application not available, starting fallback server...');
    createFallbackServer();
  }
}

// Start the application
main().catch(error => {
  console.error('💥 Railway deployment failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});