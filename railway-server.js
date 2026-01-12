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
    distFiles.slice(0, 10).forEach(file => console.log(`  - dist/${file}`));
  }
} catch (error) {
  console.log('Could not list files:', error.message);
}

// Set production environment
process.env.NODE_ENV = 'production';

// Load the full NestJS production application
const mainProductionPath = path.join(__dirname, 'dist', 'main-production.js');
console.log('Looking for NestJS production app at:', mainProductionPath);

if (fs.existsSync(mainProductionPath)) {
  console.log('✅ Found NestJS production app, starting full application...');
  console.log('🎯 This will include Swagger API docs at /api/docs');
  console.log('📚 Full REST API with all endpoints will be available');
  
  try {
    // Load and start the full NestJS application
    require(mainProductionPath);
    console.log('✅ Full NestJS application loaded successfully');
    console.log('📚 Swagger API docs available at: /api/docs');
  } catch (error) {
    console.error('❌ Failed to load NestJS production app:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('💥 Railway deployment failed - NestJS application could not start');
    process.exit(1);
  }
} else {
  console.log('⚠️ NestJS production app not found, checking alternatives...');
  
  // Try regular main.js as alternative
  const mainPath = path.join(__dirname, 'dist', 'main.js');
  console.log('Looking for regular main at:', mainPath);
  
  if (fs.existsSync(mainPath)) {
    console.log('✅ Found regular main.js, starting application...');
    try {
      require(mainPath);
      console.log('✅ NestJS application loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load main.js:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('💥 Railway deployment failed - No working NestJS application found');
      process.exit(1);
    }
  } else {
    console.error('💥 Railway deployment failed - No NestJS application files found');
    console.error('Expected files:');
    console.error('  - dist/main-production.js (preferred)');
    console.error('  - dist/main.js (alternative)');
    console.error('');
    console.error('Build process may have failed. Check Railway build logs.');
    process.exit(1);
  }
}