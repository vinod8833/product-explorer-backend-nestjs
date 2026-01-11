"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const navigation_entity_1 = require("./entities/navigation.entity");
const category_entity_1 = require("./entities/category.entity");
const product_entity_1 = require("./entities/product.entity");
const product_detail_entity_1 = require("./entities/product-detail.entity");
const review_entity_1 = require("./entities/review.entity");
const scrape_job_entity_1 = require("./entities/scrape-job.entity");
const view_history_entity_1 = require("./entities/view-history.entity");
const configService = new config_1.ConfigService();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'product_explorer'),
    entities: [
        navigation_entity_1.Navigation,
        category_entity_1.Category,
        product_entity_1.Product,
        product_detail_entity_1.ProductDetail,
        review_entity_1.Review,
        scrape_job_entity_1.ScrapeJob,
        view_history_entity_1.ViewHistory,
    ],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
});
//# sourceMappingURL=data-source.js.map