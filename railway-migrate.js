// Railway database migration script
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway';

console.log('🗄️ Railway Database Migration Script v2');
console.log('Connecting to Railway PostgreSQL...');

async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway database');
    
    // Drop existing tables if they exist (to recreate with correct schema)
    console.log('🧹 Cleaning up existing tables...');
    await client.query('DROP TABLE IF EXISTS "review" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "product_detail" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "product" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "category" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "navigation" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "scrape_job" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "view_history" CASCADE;');
    
    console.log('🔧 Creating tables with correct schema...');
    
    // Create navigation table
    await client.query(`
      CREATE TABLE "navigation" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL UNIQUE,
        "url" VARCHAR(500) NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create category table
    await client.query(`
      CREATE TABLE "category" (
        "id" SERIAL PRIMARY KEY,
        "navigation_id" INTEGER,
        "parent_id" INTEGER,
        "title" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL UNIQUE,
        "url" VARCHAR(500) NOT NULL,
        "product_count" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("navigation_id") REFERENCES "navigation"("id"),
        FOREIGN KEY ("parent_id") REFERENCES "category"("id")
      );
    `);
    
    // Create product table
    await client.query(`
      CREATE TABLE "product" (
        "id" SERIAL PRIMARY KEY,
        "source_id" VARCHAR(255) NOT NULL UNIQUE,
        "category_id" INTEGER,
        "title" VARCHAR(500) NOT NULL,
        "author" VARCHAR(255),
        "price" DECIMAL(10,2),
        "currency" VARCHAR(10) DEFAULT 'GBP',
        "image_url" VARCHAR(500),
        "source_url" VARCHAR(500) NOT NULL,
        "in_stock" BOOLEAN DEFAULT true,
        "last_scraped_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("category_id") REFERENCES "category"("id")
      );
    `);
    
    // Create product_detail table
    await client.query(`
      CREATE TABLE "product_detail" (
        "id" SERIAL PRIMARY KEY,
        "product_id" INTEGER NOT NULL UNIQUE,
        "description" TEXT,
        "publisher" VARCHAR(255),
        "publication_date" DATE,
        "isbn" VARCHAR(50),
        "page_count" INTEGER,
        "genres" TEXT[],
        "specs" JSONB,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE
      );
    `);
    
    // Create review table
    await client.query(`
      CREATE TABLE "review" (
        "id" SERIAL PRIMARY KEY,
        "product_id" INTEGER NOT NULL,
        "author" VARCHAR(255),
        "rating" DECIMAL(3,2),
        "text" TEXT,
        "review_date" DATE,
        "helpful_count" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE
      );
    `);
    
    // Create scrape_job table
    await client.query(`
      CREATE TABLE "scrape_job" (
        "id" SERIAL PRIMARY KEY,
        "target_type" VARCHAR(50) NOT NULL,
        "target_url" VARCHAR(500) NOT NULL,
        "status" VARCHAR(20) DEFAULT 'pending',
        "priority" INTEGER DEFAULT 0,
        "max_pages" INTEGER,
        "max_depth" INTEGER,
        "result" JSONB,
        "error_message" TEXT,
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create view_history table
    await client.query(`
      CREATE TABLE "view_history" (
        "id" SERIAL PRIMARY KEY,
        "session_id" VARCHAR(255),
        "user_id" VARCHAR(255),
        "product_id" INTEGER,
        "category_id" INTEGER,
        "page_url" VARCHAR(500),
        "referrer" VARCHAR(500),
        "user_agent" VARCHAR(500),
        "ip_address" INET,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('📊 Creating indexes...');
    
    // Create indexes
    await client.query('CREATE INDEX "IDX_navigation_slug" ON "navigation"("slug");');
    await client.query('CREATE INDEX "IDX_category_slug" ON "category"("slug");');
    await client.query('CREATE INDEX "IDX_category_navigation_parent" ON "category"("navigation_id", "parent_id");');
    await client.query('CREATE INDEX "IDX_product_source_id" ON "product"("source_id");');
    await client.query('CREATE INDEX "IDX_product_category_id" ON "product"("category_id");');
    await client.query('CREATE INDEX "IDX_product_last_scraped" ON "product"("last_scraped_at");');
    await client.query('CREATE INDEX "IDX_review_product_id" ON "review"("product_id");');
    await client.query('CREATE INDEX "IDX_review_rating" ON "review"("rating");');
    await client.query('CREATE INDEX "IDX_scrape_job_status" ON "scrape_job"("status");');
    await client.query('CREATE INDEX "IDX_scrape_job_target_type" ON "scrape_job"("target_type");');
    await client.query('CREATE INDEX "IDX_view_history_session" ON "view_history"("session_id", "created_at");');
    
    console.log('✅ Schema created successfully');
    
    // Insert sample data
    console.log('📝 Inserting sample data...');
    
    await client.query(`
      INSERT INTO "navigation" ("title", "slug", "url") VALUES
      ('Books', 'books', 'https://www.worldofbooks.com/en-gb/category/books'),
      ('Fiction', 'fiction', 'https://www.worldofbooks.com/en-gb/category/fiction'),
      ('Non-Fiction', 'non-fiction', 'https://www.worldofbooks.com/en-gb/category/non-fiction');
    `);
    
    await client.query(`
      INSERT INTO "category" ("navigation_id", "title", "slug", "url", "product_count") VALUES
      (2, 'Fiction', 'fiction', 'https://www.worldofbooks.com/en-gb/category/fiction', 1000),
      (3, 'Non-Fiction', 'non-fiction', 'https://www.worldofbooks.com/en-gb/category/non-fiction', 800),
      (1, 'Children Books', 'children-books', 'https://www.worldofbooks.com/en-gb/category/children', 500);
    `);
    
    // Insert sample products
    await client.query(`
      INSERT INTO "product" ("source_id", "category_id", "title", "author", "price", "currency", "source_url", "in_stock") VALUES
      ('sample-book-1', 1, 'The Great Gatsby', 'F. Scott Fitzgerald', 9.99, 'GBP', 'https://www.worldofbooks.com/en-gb/books/f-scott-fitzgerald/the-great-gatsby/9780743273565', true),
      ('sample-book-2', 1, 'To Kill a Mockingbird', 'Harper Lee', 8.99, 'GBP', 'https://www.worldofbooks.com/en-gb/books/harper-lee/to-kill-a-mockingbird/9780061120084', true),
      ('sample-book-3', 2, 'Sapiens', 'Yuval Noah Harari', 12.99, 'GBP', 'https://www.worldofbooks.com/en-gb/books/yuval-noah-harari/sapiens/9780062316097', true);
    `);
    
    console.log('✅ Sample data inserted');
    
    // Check final table count
    const finalResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('🎉 Migration complete!');
    console.log('📊 Tables created:', finalResult.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();