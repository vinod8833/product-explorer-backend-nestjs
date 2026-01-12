// Railway deployment server - Full NestJS Application Only
// This file starts the complete NestJS application with Swagger API docs

const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Railway Production Server - Full NestJS Application...');
console.log('Working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 3001);
console.log('Host:', process.env.HOST || '0.0.0.0');

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

// Set production environment
process.env.NODE_ENV = 'production';

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
  console.error('💥 Railway deployment failed - No working NestJS application found');
  console.error('Expected files:');
  appPaths.forEach(app => console.error(`  - ${app.path}`));
  console.error('');
  console.error('Build process may have failed. Check Railway build logs.');
  process.exit(1);
}