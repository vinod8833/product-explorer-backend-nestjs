import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccessibilityEnhancements1704067300000 implements MigrationInterface {
  name = 'AccessibilityEnhancements1704067300000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      ALTER TABLE "product" 
      ADD COLUMN "alt_text" TEXT,
      ADD COLUMN "accessibility_features" JSONB DEFAULT '{}',
      ADD COLUMN "content_warnings" TEXT[],
      ADD COLUMN "reading_level" VARCHAR(50),
      ADD COLUMN "language_code" VARCHAR(10) DEFAULT 'en'
    `);

    await queryRunner.query(`
      ALTER TABLE "view_history" 
      ADD COLUMN "session_id" VARCHAR(255),
      ADD COLUMN "user_agent" TEXT,
      ADD COLUMN "referrer" TEXT,
      ADD COLUMN "viewport_width" INTEGER,
      ADD COLUMN "viewport_height" INTEGER,
      ADD COLUMN "interaction_type" VARCHAR(50) DEFAULT 'view',
      ADD COLUMN "time_spent" INTEGER DEFAULT 0,
      ADD COLUMN "scroll_depth" DECIMAL(5,2) DEFAULT 0
    `);

    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id" SERIAL PRIMARY KEY,
        "session_id" VARCHAR(255) NOT NULL,
        "preferences" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE("session_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "search_analytics" (
        "id" SERIAL PRIMARY KEY,
        "query" TEXT NOT NULL,
        "filters" JSONB DEFAULT '{}',
        "results_count" INTEGER DEFAULT 0,
        "session_id" VARCHAR(255),
        "user_agent" TEXT,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "response_time_ms" INTEGER,
        "clicked_result_id" INTEGER,
        "clicked_position" INTEGER
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "performance_metrics" (
        "id" SERIAL PRIMARY KEY,
        "page_path" VARCHAR(500) NOT NULL,
        "metric_name" VARCHAR(100) NOT NULL,
        "metric_value" DECIMAL(10,2) NOT NULL,
        "session_id" VARCHAR(255),
        "user_agent" TEXT,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "additional_data" JSONB DEFAULT '{}'
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_view_history_session" ON "view_history" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_view_history_product" ON "view_history" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_search_analytics_query" ON "search_analytics" ("query")`);
    await queryRunner.query(`CREATE INDEX "IDX_search_analytics_session" ON "search_analytics" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_performance_metrics_page" ON "performance_metrics" ("page_path")`);
    await queryRunner.query(`CREATE INDEX "IDX_performance_metrics_metric" ON "performance_metrics" ("metric_name")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "performance_metrics"`);
    await queryRunner.query(`DROP TABLE "search_analytics"`);
    await queryRunner.query(`DROP TABLE "user_preferences"`);

    await queryRunner.query(`
      ALTER TABLE "view_history" 
      DROP COLUMN "scroll_depth",
      DROP COLUMN "time_spent",
      DROP COLUMN "interaction_type",
      DROP COLUMN "viewport_height",
      DROP COLUMN "viewport_width",
      DROP COLUMN "referrer",
      DROP COLUMN "user_agent",
      DROP COLUMN "session_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "product" 
      DROP COLUMN "language_code",
      DROP COLUMN "reading_level",
      DROP COLUMN "content_warnings",
      DROP COLUMN "accessibility_features",
      DROP COLUMN "alt_text"
    `);
  }
}