// Railway database migration script - TypeORM Compatible
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway';

console.log('🗄️ Railway Database Migration Script - TypeORM Compatible');
console.log('Connecting to Railway PostgreSQL...');

async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway database');
    
    // Drop existing tables if they exist (to recreate with correct schema)
    console.log('🧹 Cleaning up existing tables...');
    await client.query('DROP TABLE IF EXISTS "view_history" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "scrape_job" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "review" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "product_detail" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "product" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "category" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "navigation" CASCADE;');
    await client.query('DROP TYPE IF EXISTS "scrape_job_status_enum" CASCADE;');
    await client.query('DROP TYPE IF EXISTS "scrape_job_target_type_enum" CASCADE;');
    
    console.log('🔧 Creating TypeORM-compatible schema...');
    
    // Create ENUM types
    await client.query(`
      CREATE TYPE "scrape_job_target_type_enum" AS ENUM(
        'navigation', 'category', 'product_list', 'product_detail'
      )
    `);
    
    await client.query(`
      CREATE TYPE "scrape_job_status_enum" AS ENUM(
        'pending', 'running', 'completed', 'failed', 'cancelled'
      )
    `);

    // Create navigation table (TypeORM format)
    await client.query(`
      CREATE TABLE "navigation" (
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "source_url" character varying(500),
        "category_count" integer NOT NULL DEFAULT '0',
        "last_scraped_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_navigation_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_navigation_id" PRIMARY KEY ("id")
      )
    `);

    // Create category table (TypeORM format)
    await client.query(`
      CREATE TABLE "category" (
        "id" SERIAL NOT NULL,
        "navigation_id" integer NOT NULL,
        "parent_id" integer,
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "source_url" character varying(500),
        "product_count" integer NOT NULL DEFAULT '0',
        "last_scraped_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_category_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_category_id" PRIMARY KEY ("id")
      )
    `);

    // Create product table (TypeORM format)
    await client.query(`
      CREATE TABLE "product" (
        "id" SERIAL NOT NULL,
        "source_id" character varying(255) NOT NULL,
        "category_id" integer,
        "title" character varying(500) NOT NULL,
        "author" character varying(255),
        "price" numeric(10,2),
        "currency" character varying(10) NOT NULL DEFAULT 'GBP',
        "image_url" character varying(500),
        "source_url" character varying(500) NOT NULL,
        "in_stock" boolean NOT NULL DEFAULT true,
        "last_scraped_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_product_source_id" UNIQUE ("source_id"),
        CONSTRAINT "PK_product_id" PRIMARY KEY ("id")
      )
    `);

    // Create product_detail table (TypeORM format)
    await client.query(`
      CREATE TABLE "product_detail" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "description" text,
        "specs" jsonb,
        "publisher" character varying(255),
        "publication_date" character varying(50),
        "isbn" character varying(50),
        "page_count" integer,
        "genres" text[],
        "average_rating" numeric(3,2),
        "review_count" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "REL_product_detail_product_id" UNIQUE ("product_id"),
        CONSTRAINT "PK_product_detail_id" PRIMARY KEY ("id")
      )
    `);

    // Create review table (TypeORM format)
    await client.query(`
      CREATE TABLE "review" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "author" character varying(255),
        "rating" integer,
        "text" text,
        "review_date" character varying(50),
        "helpful_count" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_id" PRIMARY KEY ("id")
      )
    `);

    // Create scrape_job table (TypeORM format)
    await client.query(`
      CREATE TABLE "scrape_job" (
        "id" SERIAL NOT NULL,
        "target_type" "scrape_job_target_type_enum" NOT NULL,
        "target_url" character varying(500) NOT NULL,
        "status" "scrape_job_status_enum" NOT NULL DEFAULT 'pending',
        "metadata" jsonb,
        "items_processed" integer NOT NULL DEFAULT '0',
        "items_created" integer NOT NULL DEFAULT '0',
        "items_updated" integer NOT NULL DEFAULT '0',
        "error_message" text,
        "retry_count" integer NOT NULL DEFAULT '0',
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scrape_job_id" PRIMARY KEY ("id")
      )
    `);

    // Create view_history table (TypeORM format)
    await client.query(`
      CREATE TABLE "view_history" (
        "id" SERIAL NOT NULL,
        "entity_type" character varying(50) NOT NULL,
        "entity_id" integer NOT NULL,
        "user_identifier" character varying(255),
        "ip_address" character varying(45),
        "user_agent" character varying(500),
        "referrer" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_view_history_id" PRIMARY KEY ("id")
      )
    `);

    console.log('📊 Creating indexes...');
    
    // Create all indexes as per TypeORM migration
    await client.query('CREATE INDEX "IDX_navigation_slug" ON "navigation" ("slug")');
    await client.query('CREATE INDEX "IDX_category_navigation_id" ON "category" ("navigation_id")');
    await client.query('CREATE INDEX "IDX_category_parent_id" ON "category" ("parent_id")');
    await client.query('CREATE INDEX "IDX_category_slug" ON "category" ("slug")');
    await client.query('CREATE INDEX "IDX_product_source_id" ON "product" ("source_id")');
    await client.query('CREATE INDEX "IDX_product_category_id" ON "product" ("category_id")');
    await client.query('CREATE INDEX "IDX_product_last_scraped_at" ON "product" ("last_scraped_at")');
    await client.query('CREATE INDEX "IDX_product_title" ON "product" USING gin(to_tsvector(\'english\', "title"))');
    await client.query('CREATE INDEX "IDX_product_author" ON "product" ("author")');
    await client.query('CREATE INDEX "IDX_product_price" ON "product" ("price")');
    await client.query('CREATE INDEX "IDX_review_product_id" ON "review" ("product_id")');
    await client.query('CREATE INDEX "IDX_review_rating" ON "review" ("rating")');
    await client.query('CREATE INDEX "IDX_scrape_job_status" ON "scrape_job" ("status")');
    await client.query('CREATE INDEX "IDX_scrape_job_target_type" ON "scrape_job" ("target_type")');
    await client.query('CREATE INDEX "IDX_scrape_job_created_at" ON "scrape_job" ("created_at")');
    await client.query('CREATE INDEX "IDX_view_history_entity" ON "view_history" ("entity_type", "entity_id")');
    await client.query('CREATE INDEX "IDX_view_history_created_at" ON "view_history" ("created_at")');

    console.log('🔗 Creating foreign key constraints...');
    
    // Create foreign key constraints
    await client.query(`
      ALTER TABLE "category" 
      ADD CONSTRAINT "FK_category_navigation_id" 
      FOREIGN KEY ("navigation_id") REFERENCES "navigation"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await client.query(`
      ALTER TABLE "category" 
      ADD CONSTRAINT "FK_category_parent_id" 
      FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await client.query(`
      ALTER TABLE "product" 
      ADD CONSTRAINT "FK_product_category_id" 
      FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await client.query(`
      ALTER TABLE "product_detail" 
      ADD CONSTRAINT "FK_product_detail_product_id" 
      FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await client.query(`
      ALTER TABLE "review" 
      ADD CONSTRAINT "FK_review_product_id" 
      FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    
    console.log('✅ Schema created successfully');
    
    // Insert sample data with correct column names
    console.log('📝 Inserting sample data...');
    
    await client.query(`
      INSERT INTO "navigation" ("title", "slug", "source_url", "category_count") VALUES
      ('Books', 'books', 'https://www.worldofbooks.com/en-gb/category/books', 3),
      ('Fiction', 'fiction', 'https://www.worldofbooks.com/en-gb/category/fiction', 1),
      ('Non-Fiction', 'non-fiction', 'https://www.worldofbooks.com/en-gb/category/non-fiction', 1);
    `);
    
    await client.query(`
      INSERT INTO "category" ("navigation_id", "title", "slug", "source_url", "product_count") VALUES
      (2, 'Fiction', 'fiction', 'https://www.worldofbooks.com/en-gb/category/fiction', 2),
      (3, 'Non-Fiction', 'non-fiction', 'https://www.worldofbooks.com/en-gb/category/non-fiction', 1),
      (1, 'Children Books', 'children-books', 'https://www.worldofbooks.com/en-gb/category/children', 0);
    `);
    
    // Insert sample products
    await client.query(`
      INSERT INTO "product" ("source_id", "category_id", "title", "author", "price", "currency", "source_url", "in_stock") VALUES
      ('sample-book-1', 1, 'The Great Gatsby', 'F. Scott Fitzgerald', 9.99, 'GBP', 'https://www.worldofbooks.com/en-gb/books/f-scott-fitzgerald/the-great-gatsby/9780743273565', true),
      ('sample-book-2', 1, 'To Kill a Mockingbird', 'Harper Lee', 8.99, 'GBP', 'https://www.worldofbooks.com/en-gb/books/harper-lee/to-kill-a-mockingbird/9780061120084', true),
      ('sample-book-3', 2, 'Sapiens', 'Yuval Noah Harari', 12.99, 'GBP', 'https://www.worldofbooks.com/en-gb/books/yuval-noah-harari/sapiens/9780062316097', true);
    `);
    
    console.log('✅ Sample data inserted');
    
    // Create a migrations table to track that this migration was run
    await client.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL PRIMARY KEY,
        "timestamp" BIGINT NOT NULL,
        "name" VARCHAR NOT NULL
      )
    `);
    
    await client.query(`
      INSERT INTO "migrations" ("timestamp", "name") VALUES
      (1704067200000, 'InitialSchema1704067200000')
    `);
    
    console.log('✅ Migration tracking table created');
    
    // Check final table count
    const finalResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('🎉 TypeORM-compatible migration complete!');
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