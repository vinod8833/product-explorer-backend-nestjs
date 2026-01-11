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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const scraping_service_1 = require("./scraping.service");
const scraping_dto_1 = require("./dto/scraping.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ScrapingController = class ScrapingController {
    constructor(scrapingService) {
        this.scrapingService = scrapingService;
    }
    async findAllJobs(paginationDto) {
        return this.scrapingService.findAllJobs(paginationDto);
    }
    async findJobById(id) {
        return this.scrapingService.findJobById(id);
    }
    async getStats() {
        return this.scrapingService.getStats();
    }
    async createScrapeJob(createScrapeJobDto) {
        return this.scrapingService.createScrapeJob(createScrapeJobDto);
    }
    async scrapeNavigation(scrapeNavigationDto) {
        return this.scrapingService.triggerNavigationScrape(scrapeNavigationDto.baseUrl);
    }
    async scrapeCategory(scrapeCategoryDto) {
        return this.scrapingService.triggerCategoryScrape(scrapeCategoryDto.categoryUrl, scrapeCategoryDto.navigationId, scrapeCategoryDto.parentId);
    }
    async scrapeProductList(scrapeProductListDto) {
        return this.scrapingService.triggerProductListScrape(scrapeProductListDto.productListUrl, scrapeProductListDto.categoryId, scrapeProductListDto.maxPages);
    }
    async scrapeProductDetail(scrapeProductDetailDto) {
        return this.scrapingService.triggerProductDetailScrape(scrapeProductDetailDto.productUrl, scrapeProductDetailDto.productId);
    }
};
exports.ScrapingController = ScrapingController;
__decorate([
    (0, common_1.Get)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all scrape jobs with pagination' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of scrape jobs',
        type: (pagination_dto_1.PaginatedResponseDto),
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "findAllJobs", null);
__decorate([
    (0, common_1.Get)('jobs/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get scrape job by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Scrape job ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Scrape job details',
        type: scraping_dto_1.ScrapeJobDto,
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "findJobById", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get scraping statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Scraping statistics',
        type: scraping_dto_1.ScrapeStatsDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new scrape job' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Scrape job created successfully',
        type: scraping_dto_1.ScrapeJobDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scraping_dto_1.CreateScrapeJobDto]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "createScrapeJob", null);
__decorate([
    (0, common_1.Post)('navigation'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger navigation scraping' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Navigation scrape job created',
        type: scraping_dto_1.ScrapeJobDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scraping_dto_1.ScrapeNavigationDto]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeNavigation", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger category scraping' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Category scrape job created',
        type: scraping_dto_1.ScrapeJobDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scraping_dto_1.ScrapeCategoryDto]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeCategory", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger product list scraping' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Product list scrape job created',
        type: scraping_dto_1.ScrapeJobDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scraping_dto_1.ScrapeProductListDto]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeProductList", null);
__decorate([
    (0, common_1.Post)('product-detail'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger product detail scraping' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Product detail scrape job created',
        type: scraping_dto_1.ScrapeJobDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scraping_dto_1.ScrapeProductDetailDto]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeProductDetail", null);
exports.ScrapingController = ScrapingController = __decorate([
    (0, swagger_1.ApiTags)('scraping'),
    (0, common_1.Controller)('scraping'),
    __metadata("design:paramtypes", [scraping_service_1.ScrapingService])
], ScrapingController);
//# sourceMappingURL=scraping.controller.js.map