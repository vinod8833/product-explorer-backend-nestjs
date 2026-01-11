"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1704067200000 = void 0;
class InitialSchema1704067200000 {
    constructor() {
        this.name = 'InitialSchema1704067200000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TYPE "scrape_job_target_type_enum" AS ENUM(
        'navigation', 'category', 'product_list', 'product_detail'
      )
    `);
        await queryRunner.query(`
      CREATE TYPE "scrape_job_status_enum" AS ENUM(
        'pending', 'running', 'completed', 'failed', 'cancelled'
      )
    `);
        await queryRunner.query(`
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
        await queryRunner.query(`
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
        await queryRunner.query(`
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
        await queryRunner.query(`
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
        await queryRunner.query(`
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
        await queryRunner.query(`
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
        await queryRunner.query(`
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
        await queryRunner.query(`CREATE INDEX "IDX_navigation_slug" ON "navigation" ("slug")`);
        await queryRunner.query(`CREATE INDEX "IDX_category_navigation_id" ON "category" ("navigation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_category_parent_id" ON "category" ("parent_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_category_slug" ON "category" ("slug")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_source_id" ON "product" ("source_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_category_id" ON "product" ("category_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_last_scraped_at" ON "product" ("last_scraped_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_title" ON "product" USING gin(to_tsvector('english', "title"))`);
        await queryRunner.query(`CREATE INDEX "IDX_product_author" ON "product" ("author")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_price" ON "product" ("price")`);
        await queryRunner.query(`CREATE INDEX "IDX_review_product_id" ON "review" ("product_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_review_rating" ON "review" ("rating")`);
        await queryRunner.query(`CREATE INDEX "IDX_scrape_job_status" ON "scrape_job" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_scrape_job_target_type" ON "scrape_job" ("target_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_scrape_job_created_at" ON "scrape_job" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_view_history_entity" ON "view_history" ("entity_type", "entity_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_view_history_created_at" ON "view_history" ("created_at")`);
        await queryRunner.query(`
      ALTER TABLE "category" 
      ADD CONSTRAINT "FK_category_navigation_id" 
      FOREIGN KEY ("navigation_id") REFERENCES "navigation"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "category" 
      ADD CONSTRAINT "FK_category_parent_id" 
      FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "product" 
      ADD CONSTRAINT "FK_product_category_id" 
      FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "product_detail" 
      ADD CONSTRAINT "FK_product_detail_product_id" 
      FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "review" 
      ADD CONSTRAINT "FK_review_product_id" 
      FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_review_product_id"`);
        await queryRunner.query(`ALTER TABLE "product_detail" DROP CONSTRAINT "FK_product_detail_product_id"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_product_category_id"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_category_parent_id"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_category_navigation_id"`);
        await queryRunner.query(`DROP INDEX "IDX_view_history_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_view_history_entity"`);
        await queryRunner.query(`DROP INDEX "IDX_scrape_job_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_scrape_job_target_type"`);
        await queryRunner.query(`DROP INDEX "IDX_scrape_job_status"`);
        await queryRunner.query(`DROP INDEX "IDX_review_rating"`);
        await queryRunner.query(`DROP INDEX "IDX_review_product_id"`);
        await queryRunner.query(`DROP INDEX "IDX_product_price"`);
        await queryRunner.query(`DROP INDEX "IDX_product_author"`);
        await queryRunner.query(`DROP INDEX "IDX_product_title"`);
        await queryRunner.query(`DROP INDEX "IDX_product_last_scraped_at"`);
        await queryRunner.query(`DROP INDEX "IDX_product_category_id"`);
        await queryRunner.query(`DROP INDEX "IDX_product_source_id"`);
        await queryRunner.query(`DROP INDEX "IDX_category_slug"`);
        await queryRunner.query(`DROP INDEX "IDX_category_parent_id"`);
        await queryRunner.query(`DROP INDEX "IDX_category_navigation_id"`);
        await queryRunner.query(`DROP INDEX "IDX_navigation_slug"`);
        await queryRunner.query(`DROP TABLE "view_history"`);
        await queryRunner.query(`DROP TABLE "scrape_job"`);
        await queryRunner.query(`DROP TABLE "review"`);
        await queryRunner.query(`DROP TABLE "product_detail"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "navigation"`);
        await queryRunner.query(`DROP TYPE "scrape_job_status_enum"`);
        await queryRunner.query(`DROP TYPE "scrape_job_target_type_enum"`);
    }
}
exports.InitialSchema1704067200000 = InitialSchema1704067200000;
//# sourceMappingURL=001-initial-schema.js.map