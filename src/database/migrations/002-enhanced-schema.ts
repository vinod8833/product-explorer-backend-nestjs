import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhancedSchema1704067300000 implements MigrationInterface {
  name = 'EnhancedSchema1704067300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cache_entry" (
        "id" SERIAL NOT NULL,
        "key" character varying(255) NOT NULL,
        "value" jsonb NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_cache_entry_key" UNIQUE ("key"),
        CONSTRAINT "PK_cache_entry_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "scraping_stats" (
        "id" SERIAL NOT NULL,
        "domain" character varying(255) NOT NULL,
        "date" DATE NOT NULL,
        "requests_made" integer NOT NULL DEFAULT '0',
        "requests_successful" integer NOT NULL DEFAULT '0',
        "requests_failed" integer NOT NULL DEFAULT '0',
        "avg_response_time" numeric(10,2),
        "data_scraped_mb" numeric(10,2) NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_scraping_stats_domain_date" UNIQUE ("domain", "date"),
        CONSTRAINT "PK_scraping_stats_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_availability" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "in_stock" boolean NOT NULL,
        "price" numeric(10,2),
        "currency" character varying(10),
        "condition" character varying(50),
        "checked_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_availability_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "search_analytics" (
        "id" SERIAL NOT NULL,
        "query" character varying(500) NOT NULL,
        "results_count" integer NOT NULL DEFAULT '0',
        "user_identifier" character varying(255),
        "ip_address" character varying(45),
        "response_time_ms" integer,
        "clicked_result_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_search_analytics_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "rate_limit" (
        "id" SERIAL NOT NULL,
        "identifier" character varying(255) NOT NULL,
        "endpoint" character varying(255) NOT NULL,
        "requests_count" integer NOT NULL DEFAULT '0',
        "window_start" TIMESTAMP NOT NULL,
        "window_end" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_rate_limit_identifier_endpoint" UNIQUE ("identifier", "endpoint", "window_start"),
        CONSTRAINT "PK_rate_limit_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_recommendation" (
        "id" SERIAL NOT NULL,
        "source_product_id" integer NOT NULL,
        "recommended_product_id" integer NOT NULL,
        "recommendation_type" character varying(50) NOT NULL,
        "score" numeric(5,4) NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_product_recommendation" UNIQUE ("source_product_id", "recommended_product_id", "recommendation_type"),
        CONSTRAINT "PK_product_recommendation_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_cache_entry_expires_at" ON "cache_entry" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_scraping_stats_domain_date" ON "scraping_stats" ("domain", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_availability_product_id" ON "product_availability" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_availability_checked_at" ON "product_availability" ("checked_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_search_analytics_query" ON "search_analytics" USING gin(to_tsvector('english', "query"))`);
    await queryRunner.query(`CREATE INDEX "IDX_search_analytics_created_at" ON "search_analytics" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_rate_limit_window" ON "rate_limit" ("window_start", "window_end")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_recommendation_source" ON "product_recommendation" ("source_product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_recommendation_score" ON "product_recommendation" ("score" DESC)`);

    await queryRunner.query(`
      ALTER TABLE "product_availability" 
      ADD CONSTRAINT "FK_product_availability_product_id" 
      FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "search_analytics" 
      ADD CONSTRAINT "FK_search_analytics_clicked_result" 
      FOREIGN KEY ("clicked_result_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "product_recommendation" 
      ADD CONSTRAINT "FK_product_recommendation_source" 
      FOREIGN KEY ("source_product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "product_recommendation" 
      ADD CONSTRAINT "FK_product_recommendation_target" 
      FOREIGN KEY ("recommended_product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE MATERIALIZED VIEW "popular_products" AS
      SELECT 
        p.id,
        p.title,
        p.author,
        p.price,
        p.currency,
        p.image_url,
        COUNT(vh.id) as view_count,
        AVG(pd.average_rating) as avg_rating,
        SUM(pd.review_count) as total_reviews
      FROM product p
      LEFT JOIN view_history vh ON vh.entity_type = 'product' AND vh.entity_id = p.id
      LEFT JOIN product_detail pd ON pd.product_id = p.id
      WHERE p.in_stock = true
      GROUP BY p.id, p.title, p.author, p.price, p.currency, p.image_url, pd.average_rating, pd.review_count
      ORDER BY view_count DESC, avg_rating DESC
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_popular_products_id" ON "popular_products" ("id")`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION refresh_popular_products()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_cache()
      RETURNS void AS $$
      BEGIN
        DELETE FROM cache_entry WHERE expires_at < NOW();
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS cleanup_expired_cache()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS refresh_popular_products()`);

    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "popular_products"`);

    await queryRunner.query(`ALTER TABLE "product_recommendation" DROP CONSTRAINT "FK_product_recommendation_target"`);
    await queryRunner.query(`ALTER TABLE "product_recommendation" DROP CONSTRAINT "FK_product_recommendation_source"`);
    await queryRunner.query(`ALTER TABLE "search_analytics" DROP CONSTRAINT "FK_search_analytics_clicked_result"`);
    await queryRunner.query(`ALTER TABLE "product_availability" DROP CONSTRAINT "FK_product_availability_product_id"`);

    await queryRunner.query(`DROP INDEX "IDX_product_recommendation_score"`);
    await queryRunner.query(`DROP INDEX "IDX_product_recommendation_source"`);
    await queryRunner.query(`DROP INDEX "IDX_rate_limit_window"`);
    await queryRunner.query(`DROP INDEX "IDX_search_analytics_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_search_analytics_query"`);
    await queryRunner.query(`DROP INDEX "IDX_product_availability_checked_at"`);
    await queryRunner.query(`DROP INDEX "IDX_product_availability_product_id"`);
    await queryRunner.query(`DROP INDEX "IDX_scraping_stats_domain_date"`);
    await queryRunner.query(`DROP INDEX "IDX_cache_entry_expires_at"`);

    await queryRunner.query(`DROP TABLE "product_recommendation"`);
    await queryRunner.query(`DROP TABLE "rate_limit"`);
    await queryRunner.query(`DROP TABLE "search_analytics"`);
    await queryRunner.query(`DROP TABLE "product_availability"`);
    await queryRunner.query(`DROP TABLE "scraping_stats"`);
    await queryRunner.query(`DROP TABLE "cache_entry"`);
  }
}