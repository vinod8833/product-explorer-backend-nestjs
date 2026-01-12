const http = require('http');

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

console.log('Starting simple test server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Host:', host);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: port,
      host: host,
      environment: process.env.NODE_ENV || 'unknown'
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Simple test server is running',
      timestamp: new Date().toISOString(),
      health: '/health'
    }));
  }
});

server.listen(port, host, () => {
  console.log(` Server running at http://${host}:${port}`);
  console.log(` Health check: http://${host}:${port}/health`);
});

server.on('error', (err) => {
  console.error(' Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});