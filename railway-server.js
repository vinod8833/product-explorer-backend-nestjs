// Railway deployment fallback server
// This file serves as a fallback if the src/railway-server.js path doesn't work

console.log('🚀 Starting Railway Fallback Server...');
console.log('Attempting to load main railway server...');

try {
  // Try to load the main railway server
  require('./src/railway-server.js');
} catch (error) {
  console.error('❌ Failed to load main railway server:', error.message);
  console.log('🔄 Starting minimal fallback server...');
  
  // Minimal fallback server
  const http = require('http');
  const port = process.env.PORT || 3001;
  const host = '0.0.0.0';
  
  const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.url === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Railway fallback server running',
        environment: process.env.NODE_ENV || 'unknown'
      }, null, 2));
    } else if (req.url === '/') {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Product Data Explorer API - Railway Deployment',
        status: 'Fallback server active',
        timestamp: new Date().toISOString(),
        note: 'This is a minimal fallback server. For full functionality, use local development.',
        repository: 'https://github.com/vinod8833/product-explorer-backend-nestjs',
        localSetup: 'git clone && make setup && make scrape-data'
      }, null, 2));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Not Found',
        path: req.url,
        available: ['/', '/health']
      }, null, 2));
    }
  });
  
  server.listen(port, host, () => {
    console.log(`✅ Fallback server running at http://${host}:${port}`);
  });
  
  server.on('error', (err) => {
    console.error('❌ Fallback server error:', err);
    process.exit(1);
  });
}