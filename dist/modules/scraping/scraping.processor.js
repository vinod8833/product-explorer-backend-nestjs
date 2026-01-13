"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ScrapingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapingProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const scraping_service_1 = require("./scraping.service");
const world_of_books_scraper_service_1 = require("./world-of-books-scraper.service");
const scrape_job_entity_1 = require("../../database/entities/scrape-job.entity");
let ScrapingProcessor = ScrapingProcessor_1 = class ScrapingProcessor {
    constructor(scrapingService, worldOfBooksScraperService) {
        this.scrapingService = scrapingService;
        this.worldOfBooksScraperService = worldOfBooksScraperService;
        this.logger = new common_1.Logger(ScrapingProcessor_1.name);
    }
    async handleScrapeJob(job) {
        const { jobId, targetUrl, targetType, metadata } = job.data;
        this.logger.log(`Processing scrape job ${jobId}: ${targetType} - ${targetUrl}`);
        try {
            await this.scrapingService.updateJobStatus(jobId, scrape_job_entity_1.ScrapeJobStatus.RUNNING);
            let itemsProcessed = 0;
            switch (targetType) {
                case scrape_job_entity_1.ScrapeJobType.NAVIGATION:
                    itemsProcessed = await this.handleNavigationScrape(jobId, targetUrl, metadata);
                    break;
                case scrape_job_entity_1.ScrapeJobType.CATEGORY:
                    itemsProcessed = await this.handleCategoryScrape(jobId, targetUrl, metadata);
                    break;
                case scrape_job_entity_1.ScrapeJobType.PRODUCT_LIST:
                    itemsProcessed = await this.handleProductListScrape(jobId, targetUrl, metadata);
                    break;
                case scrape_job_entity_1.ScrapeJobType.PRODUCT_DETAIL:
                    itemsProcessed = await this.handleProductDetailScrape(jobId, targetUrl, metadata);
                    break;
                default:
                    throw new Error(`Unknown scrape job type: ${targetType}`);
            }
            await this.scrapingService.updateJobStatus(jobId, scrape_job_entity_1.ScrapeJobStatus.COMPLETED, null, itemsProcessed);
            this.logger.log(`Completed scrape job ${jobId}: processed ${itemsProcessed} items`);
        }
        catch (error) {
            this.logger.error(`Failed scrape job ${jobId}: ${error.message}`, error.stack);
            await this.scrapingService.updateJobStatus(jobId, scrape_job_entity_1.ScrapeJobStatus.FAILED, error.message);
            throw error;
        }
    }
    async handleNavigationScrape(jobId, targetUrl, metadata) {
        const items = await this.worldOfBooksScraperService.scrapeNavigation();
        const savedItems = await this.scrapingService.saveNavigationItems(items);
        for (const item of savedItems) {
            if (item.sourceUrl) {
                await this.scrapingService.triggerCategoryScrape(item.sourceUrl, item.id);
            }
        }
        return savedItems.length;
    }
    async handleCategoryScrape(jobId, targetUrl, metadata) {
        const { navigationId, parentId } = metadata;
        const items = await this.worldOfBooksScraperService.scrapeCategories(targetUrl);
        const savedItems = await this.scrapingService.saveCategoryItems(items, navigationId, parentId);
        for (const item of savedItems) {
            if (item.sourceUrl) {
                await this.scrapingService.triggerProductListScrape(item.sourceUrl, item.id);
            }
        }
        return savedItems.length;
    }
    async handleProductListScrape(jobId, targetUrl, metadata) {
        const { categoryId, maxPages } = metadata;
        const items = await this.worldOfBooksScraperService.scrapeProducts(targetUrl, maxPages);
        const savedItems = await this.scrapingService.saveProductItems(items, categoryId);
        const sampleSize = Math.min(5, savedItems.length);
        const sampleItems = savedItems.slice(0, sampleSize);
        for (const item of sampleItems) {
            if (item.sourceUrl) {
                await this.scrapingService.triggerProductDetailScrape(item.sourceUrl, item.id);
            }
        }
        return savedItems.length;
    }
    async handleProductDetailScrape(jobId, targetUrl, metadata) {
        const { productId } = metadata;
        const item = await this.worldOfBooksScraperService.scrapeProductDetail(targetUrl);
        if (item) {
            await this.scrapingService.saveProductDetail(item, productId);
            return 1;
        }
        return 0;
    }
};
exports.ScrapingProcessor = ScrapingProcessor;
__decorate([
    (0, bull_1.Process)('scrape'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScrapingProcessor.prototype, "handleScrapeJob", null);
exports.ScrapingProcessor = ScrapingProcessor = ScrapingProcessor_1 = __decorate([
    (0, bull_1.Processor)('scraping'),
    __metadata("design:paramtypes", [scraping_service_1.ScrapingService,
        world_of_books_scraper_service_1.WorldOfBooksScraperService])
], ScrapingProcessor);
//# sourceMappingURL=scraping.processor.js.map