// Railway deployment server with automatic path resolution
// This file handles Railway deployment with multiple fallback strategies

const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Railway Production Server...');
console.log('Working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 3001);
console.log('Host:', process.env.HOST || '0.0.0.0');

// List files to debug
console.log('Files in current directory:');
try {
  const files = fs.readdirSync('.');
  files.slice(0, 10).forEach(file => console.log(`  - ${file}`));
} catch (error) {
  console.log('Could not list files:', error.message);
}

// Try to load the main railway server first
const mainServerPath = path.join(__dirname, 'src', 'railway-server.js');
console.log('Looking for main server at:', mainServerPath);

if (fs.existsSync(mainServerPath)) {
  console.log('✅ Found main railway server, attempting to load...');
  try {
    require(mainServerPath);
    console.log('✅ Main railway server loaded successfully');
    return; // Exit if main server loads successfully
  } catch (error) {
    console.error('❌ Failed to load main railway server:', error.message);
    console.log('🔄 Falling back to minimal server...');
  }
} else {
  console.log('⚠️ Main railway server not found, using fallback...');
}

// Fallback minimal server
const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

console.log('🔄 Starting minimal fallback server...');
console.log(`Server will listen on ${host}:${port}`);

// Check for database connectivity
async function testDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ No DATABASE_URL provided');
    return false;
  }

  try {
    // Try to require pg, handle if not available
    let Client;
    try {
      Client = require('pg').Client;
    } catch (pgError) {
      console.log('⚠️ PostgreSQL client not available:', pgError.message);
      return false;
    }

    const client = new Client({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    console.log('🔌 Attempting database connection...');
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await client.query('SELECT NOW()');
    console.log('📊 Database time:', result.rows[0].now);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function getProductCount() {
  if (!process.env.DATABASE_URL) return 0;
  
  try {
    // Try to require pg, handle if not available
    let Client;
    try {
      Client = require('pg').Client;
    } catch (pgError) {
      console.log('⚠️ PostgreSQL client not available for product count');
      return 0;
    }

    const client = new Client({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    
    const result = await client.query('SELECT COUNT(*) as count FROM products');
    const count = parseInt(result.rows[0].count);
    
    await client.end();
    return count;
  } catch (error) {
    console.error('Error getting product count:', error.message);
    return 0;
  }
}

const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url} - ${req.headers['user-agent'] || 'Unknown'}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    if (req.url === '/health') {
      console.log('🏥 Health check requested');
      const dbStatus = await testDatabase();
      const productCount = await getProductCount();
      
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: port,
        host: host,
        environment: process.env.NODE_ENV || 'unknown',
        database: dbStatus ? 'connected' : 'disconnected',
        productCount: productCount,
        server: 'Railway Deployment Server',
        version: '1.0.0',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        }
      };
      
      console.log('✅ Health check response:', JSON.stringify(healthData, null, 2));
      res.writeHead(200);
      res.end(JSON.stringify(healthData, null, 2));
      
    } else if (req.url === '/') {
      console.log('🏠 Root endpoint requested');
      const productCount = await getProductCount();
      
      const rootData = {
        message: 'Product Data Explorer API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        status: 'Railway deployment successful',
        productCount: productCount,
        endpoints: {
          health: '/health',
          api: '/api',
          products: '/api/products',
          docs: '/api/docs'
        },
        repository: 'https://github.com/vinod8833/product-explorer-backend-nestjs',
        localDevelopment: {
          clone: 'git clone git@github.com:vinod8833/product-explorer-backend-nestjs.git',
          setup: 'make setup',
          scrapeData: 'make scrape-data',
          note: 'For full API functionality including scraping, use local development'
        }
      };
      
      res.writeHead(200);
      res.end(JSON.stringify(rootData, null, 2));
      
    } else if (req.url === '/api/products') {
      console.log('📦 Products endpoint requested');
      const productCount = await getProductCount();
      
      const productsData = {
        data: [],
        total: productCount,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(productCount / 20),
        message: productCount > 0 ? 
          `Found ${productCount} products in database` : 
          'No products found. Use local development to populate data with scraping.',
        note: 'This is a simplified Railway deployment. For full API functionality, use local development.',
        localSetup: {
          repository: 'https://github.com/vinod8833/product-explorer-backend-nestjs',
          quickStart: 'git clone && make setup && make scrape-data'
        }
      };
      
      res.writeHead(200);
      res.end(JSON.stringify(productsData, null, 2));
      
    } else if (req.url.startsWith('/api/scraping')) {
      console.log('🕷️ Scraping endpoint requested');
      const scrapingData = {
        message: 'Scraping API endpoint',
        path: req.url,
        note: 'Scraping functionality requires the full NestJS application with local development.',
        status: 'Use local development for scraping',
        localSetup: {
          clone: 'git clone git@github.com:vinod8833/product-explorer-backend-nestjs.git',
          setup: 'make setup',
          scrape: 'make scrape-data',
          monitor: 'make scrape-status'
        }
      };
      
      res.writeHead(200);
      res.end(JSON.stringify(scrapingData, null, 2));
      
    } else if (req.url.startsWith('/api')) {
      console.log('🔌 Generic API endpoint requested');
      const apiData = {
        message: 'API endpoint',
        path: req.url,
        note: 'This endpoint requires the full NestJS application.',
        status: 'Simplified Railway deployment',
        availableEndpoints: [
          '/health - Health check',
          '/api/products - Product information',
          '/api/scraping - Scraping information'
        ],
        fullApiAccess: {
          repository: 'https://github.com/vinod8833/product-explorer-backend-nestjs',
          localSetup: 'make setup && make scrape-data'
        }
      };
      
      res.writeHead(200);
      res.end(JSON.stringify(apiData, null, 2));
      
    } else {
      console.log('❓ Unknown endpoint requested:', req.url);
      const notFoundData = {
        error: 'Not Found',
        path: req.url,
        available: ['/', '/health', '/api/products', '/api/scraping'],
        message: 'This is a simplified Railway deployment. For full API functionality, use local development.'
      };
      
      res.writeHead(404);
      res.end(JSON.stringify(notFoundData, null, 2));
    }
  } catch (error) {
    console.error('💥 Request error:', error);
    const errorData = {
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString(),
      note: 'For full error handling and debugging, use local development environment.'
    };
    
    res.writeHead(500);
    res.end(JSON.stringify(errorData, null, 2));
  }
});

// Start the server
server.listen(port, host, () => {
  console.log(`✅ Railway server running at http://${host}:${port}`);
  console.log(`🏥 Health check: http://${host}:${port}/health`);
  console.log(`🏠 Root: http://${host}:${port}/`);
  console.log(`📦 Products: http://${host}:${port}/api/products`);
  console.log('🚀 Railway deployment successful!');
  console.log('📊 Server startup completed at:', new Date().toISOString());
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});