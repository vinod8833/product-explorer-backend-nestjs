// Check Railway database for image URLs and test API
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway';

console.log('🔍 Checking Railway Database for Image URLs...');

async function checkDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway database');
    
    // Check products with image URLs
    const productsWithImages = await client.query(`
      SELECT id, title, author, price, image_url, source_url 
      FROM product 
      WHERE image_url IS NOT NULL AND image_url != ''
      ORDER BY id
    `);
    
    console.log(`📸 Products with image URLs: ${productsWithImages.rows.length}`);
    productsWithImages.rows.forEach(product => {
      console.log(`  - ${product.title} by ${product.author}`);
      console.log(`    Image: ${product.image_url || 'No image'}`);
      console.log(`    Source: ${product.source_url}`);
      console.log('');
    });
    
    // Check products without image URLs
    const productsWithoutImages = await client.query(`
      SELECT id, title, author, price, source_url 
      FROM product 
      WHERE image_url IS NULL OR image_url = ''
      ORDER BY id
    `);
    
    console.log(`❌ Products without image URLs: ${productsWithoutImages.rows.length}`);
    productsWithoutImages.rows.forEach(product => {
      console.log(`  - ${product.title} by ${product.author}`);
      console.log(`    Source: ${product.source_url}`);
      console.log('');
    });
    
    // Total product count
    const totalProducts = await client.query('SELECT COUNT(*) as count FROM product');
    console.log(`📊 Total products in database: ${totalProducts.rows[0].count}`);
    
    // Check categories
    const categories = await client.query('SELECT id, title, product_count FROM category ORDER BY id');
    console.log(`📂 Categories: ${categories.rows.length}`);
    categories.rows.forEach(category => {
      console.log(`  - ${category.title} (${category.product_count} products)`);
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();