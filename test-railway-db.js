// Test Railway database connection and query
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway';

console.log('🧪 Testing Railway Database Connection');

async function testDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway database');
    
    // Test basic query
    const result = await client.query('SELECT COUNT(*) as count FROM "product"');
    console.log('📊 Product count:', result.rows[0].count);
    
    // Test products query
    const products = await client.query('SELECT * FROM "product" LIMIT 3');
    console.log('📦 Sample products:');
    products.rows.forEach(product => {
      console.log(`  - ${product.title} by ${product.author} (£${product.price})`);
    });
    
    // Test categories
    const categories = await client.query('SELECT * FROM "category"');
    console.log('📂 Categories:');
    categories.rows.forEach(category => {
      console.log(`  - ${category.title} (${category.product_count} products)`);
    });
    
    console.log('✅ Database test successful');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await client.end();
  }
}

testDatabase();