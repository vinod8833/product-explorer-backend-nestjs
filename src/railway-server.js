const http = require('http');
const { Client } = require('pg');

const port = process.env.PORT || 3001;
const host = '0.0.0.0';

console.log('🚀 Starting Railway Production Server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Host:', host);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

async function testDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL provided');
    return false;
  }

  try {
    const client = new Client({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
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
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
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
      const dbStatus = await testDatabase();
      const productCount = await getProductCount();
      
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: port,
        host: host,
        environment: process.env.NODE_ENV || 'unknown',
        database: dbStatus ? 'connected' : 'disconnected',
        productCount: productCount,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        }
      }, null, 2));
      
    } else if (req.url === '/') {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Product Data Explorer API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          api: '/api',
          products: '/api/products',
          docs: '/api/docs'
        },
        status: 'Railway deployment successful',
        note: 'This is a simplified Railway server. For full API functionality, use the local development environment.'
      }, null, 2));
      
    } else if (req.url === '/api/products') {
      // Simple products endpoint
      const productCount = await getProductCount();
      
      res.writeHead(200);
      res.end(JSON.stringify({
        data: [],
        total: productCount,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(productCount / 20),
        message: productCount > 0 ? 
          `Found ${productCount} products in database` : 
          'No products found. Use the scraping endpoints to populate data.',
        endpoints: {
          search: '/api/products/search',
          categories: '/api/categories',
          scraping: '/api/scraping'
        }
      }, null, 2));
      
    } else if (req.url.startsWith('/api/scraping')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Scraping API endpoint',
        path: req.url,
        note: 'Scraping functionality requires the full NestJS application. Use local development for scraping.',
        localSetup: {
          clone: 'git clone git@github.com:vinod8833/product-explorer-backend-nestjs.git',
          setup: 'make setup',
          scrape: 'make scrape-data'
        }
      }, null, 2));
      
    } else if (req.url.startsWith('/api')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'API endpoint',
        path: req.url,
        note: 'This endpoint requires the full NestJS application.',
        availableEndpoints: [
          '/health',
          '/api/products',
          '/api/scraping'
        ],
        fullApiSetup: {
          repository: 'https://github.com/vinod8833/product-explorer-backend-nestjs',
          quickStart: 'make setup && make scrape-data'
        }
      }, null, 2));
      
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Not Found',
        path: req.url,
        available: ['/', '/health', '/api/products', '/api/scraping']
      }, null, 2));
    }
  } catch (error) {
    console.error('Request error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
  }
});

server.listen(port, host, () => {
  console.log(`✅ Server running at http://${host}:${port}`);
  console.log(`🏥 Health check: http://${host}:${port}/health`);
  console.log(`🏠 Root: http://${host}:${port}/`);
  console.log(`📦 Products: http://${host}:${port}/api/products`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

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
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});