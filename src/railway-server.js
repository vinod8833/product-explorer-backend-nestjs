const http = require('http');
const { Client } = require('pg');

const port = process.env.PORT || 3001;
const host = '0.0.0.0';

console.log('🚀 Starting Railway Production Server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Host:', host);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Test database connection
async function testDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL provided');
    return false;
  }

  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log('✅ Database connection successful');
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    const dbStatus = await testDatabase();
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: port,
      host: host,
      environment: process.env.NODE_ENV || 'unknown',
      database: dbStatus ? 'connected' : 'disconnected',
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
        docs: '/api/docs'
      },
      status: 'Railway deployment successful'
    }, null, 2));
  } else if (req.url.startsWith('/api')) {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'API endpoint',
      path: req.url,
      note: 'Full NestJS API will be available once deployment is stable'
    }, null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      path: req.url,
      available: ['/', '/health', '/api']
    }, null, 2));
  }
});

server.listen(port, host, () => {
  console.log(`✅ Server running at http://${host}:${port}`);
  console.log(`💚 Health check: http://${host}:${port}/health`);
  console.log(`🌐 Root: http://${host}:${port}/`);
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

// Keep the process alive
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});