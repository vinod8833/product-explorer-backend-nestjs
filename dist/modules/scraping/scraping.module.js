"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const scraping_controller_1 = require("./scraping.controller");
const scraping_service_1 = require("./scraping.service");
const world_of_books_scraper_service_1 = require("./world-of-books-scraper.service");
const world_of_books_api_service_1 = require("./world-of-books-api.service");
const world_of_books_enhanced_service_1 = require("./world-of-books-enhanced.service");
const startup_scraping_service_1 = require("./startup-scraping.service");
const scraping_processor_1 = require("./scraping.processor");
const scrape_job_entity_1 = require("../../database/entities/scrape-job.entity");
const navigation_entity_1 = require("../../database/entities/navigation.entity");
const category_entity_1 = require("../../database/entities/category.entity");
const product_entity_1 = require("../../database/entities/product.entity");
const product_detail_entity_1 = require("../../database/entities/product-detail.entity");
const review_entity_1 = require("../../database/entities/review.entity");
let ScrapingModule = class ScrapingModule {
};
exports.ScrapingModule = ScrapingModule;
exports.ScrapingModule = ScrapingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                scrape_job_entity_1.ScrapeJob,
                navigation_entity_1.Navigation,
                category_entity_1.Category,
                product_entity_1.Product,
                product_detail_entity_1.ProductDetail,
                review_entity_1.Review,
            ]),
            bull_1.BullModule.registerQueue({
                name: 'scraping',
            }),
        ],
        controllers: [scraping_controller_1.ScrapingController],
        providers: [
            scraping_service_1.ScrapingService,
            world_of_books_scraper_service_1.WorldOfBooksScraperService,
            world_of_books_api_service_1.WorldOfBooksApiService,
            world_of_books_enhanced_service_1.WorldOfBooksEnhancedService,
            startup_scraping_service_1.StartupScrapingService,
            scraping_processor_1.ScrapingProcessor
        ],
        exports: [
            scraping_service_1.ScrapingService,
            world_of_books_scraper_service_1.WorldOfBooksScraperService,
            world_of_books_api_service_1.WorldOfBooksApiService,
            world_of_books_enhanced_service_1.WorldOfBooksEnhancedService,
            startup_scraping_service_1.StartupScrapingService
        ],
    })
], ScrapingModule);
//# sourceMappingURL=scraping.module.js.map