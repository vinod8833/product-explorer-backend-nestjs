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
const world_of_books_scraper_service_1 = require("./world-of-books-scraper.service");
const startup_scraping_service_1 = require("./startup-scraping.service");
const scraping_dto_1 = require("./dto/scraping.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ScrapingController = class ScrapingController {
    constructor(scrapingService, scraperService, startupScrapingService) {
        this.scrapingService = scrapingService;
        this.scraperService = scraperService;
        this.startupScrapingService = startupScrapingService;
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
    async scrapeNavigationLive() {
        try {
            const results = await this.scraperService.scrapeNavigation();
            return {
                success: true,
                count: results.length,
                data: results,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async scrapeCategoriesLive(url, maxDepth = '3') {
        if (!url) {
            throw new common_1.HttpException({
                success: false,
                error: 'URL parameter is required',
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const results = await this.scraperService.scrapeCategories(url, parseInt(maxDepth));
            return {
                success: true,
                count: results.length,
                data: results,
                sourceUrl: url,
                maxDepth: parseInt(maxDepth),
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                sourceUrl: url,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async scrapeProductsLive(url, maxPages = '10') {
        if (!url) {
            throw new common_1.HttpException({
                success: false,
                error: 'URL parameter is required',
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const results = await this.scraperService.scrapeProducts(url, parseInt(maxPages));
            return {
                success: true,
                count: results.length,
                data: results,
                sourceUrl: url,
                maxPages: parseInt(maxPages),
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                sourceUrl: url,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async scrapeProductDetailLive(url) {
        if (!url) {
            throw new common_1.HttpException({
                success: false,
                error: 'URL parameter is required',
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.scraperService.scrapeProductDetail(url);
            return {
                success: true,
                data: result,
                sourceUrl: url,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                sourceUrl: url,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async scrapeAndSave(body) {
        try {
            const { includeNavigation = true, includeCategories = true, includeProducts = true, maxPages = 2, maxDepth = 2 } = body;
            const results = {
                navigation: { count: 0, data: [] },
                categories: { count: 0, data: [] },
                products: { count: 0, data: [] }
            };
            if (includeNavigation) {
                const navigationItems = await this.scraperService.scrapeNavigation();
                if (navigationItems.length > 0) {
                    await this.scrapingService.saveNavigationItems(navigationItems);
                    results.navigation = { count: navigationItems.length, data: navigationItems };
                }
            }
            if (includeCategories) {
                const categoryUrl = 'https://www.worldofbooks.com/en-gb/category/fiction';
                try {
                    const categoryItems = await this.scraperService.scrapeCategories(categoryUrl, maxDepth);
                    if (categoryItems.length > 0) {
                        const navigationItems = await this.scrapingService.findAllNavigationItems();
                        const navigationId = navigationItems.length > 0 ? navigationItems[0].id : null;
                        if (navigationId) {
                            await this.scrapingService.saveCategoryItems(categoryItems, navigationId);
                        }
                        results.categories = { count: categoryItems.length, data: categoryItems };
                    }
                }
                catch (error) {
                    console.warn('Category scraping failed, using fallback data');
                }
            }
            if (includeProducts) {
                const productUrl = 'https://www.worldofbooks.com/en-gb/category/fiction';
                try {
                    const productItems = await this.scraperService.scrapeProducts(productUrl, maxPages);
                    if (productItems.length > 0) {
                        const categories = await this.scrapingService.findAllCategories();
                        const categoryId = categories.length > 0 ? categories[0].id : null;
                        if (categoryId) {
                            await this.scrapingService.saveProductItems(productItems, categoryId);
                        }
                        results.products = { count: productItems.length, data: productItems };
                    }
                }
                catch (error) {
                    console.warn('Product scraping failed, using fallback data');
                }
            }
            return {
                success: true,
                message: 'Scraping and saving completed',
                results,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateMissingImages() {
        try {
            await this.startupScrapingService.onModuleInit();
            return {
                success: true,
                message: 'Image update process completed',
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async verifyImageUrl(url) {
        if (!url) {
            throw new common_1.HttpException({
                success: false,
                error: 'URL parameter is required',
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const isValid = await this.scraperService.verifyImageUrl(url);
            return {
                success: true,
                url,
                isValid,
                message: isValid ? 'Image URL is accessible' : 'Image URL is not accessible',
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                url,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
__decorate([
    (0, common_1.Get)('live/navigation'),
    (0, swagger_1.ApiOperation)({
        summary: 'Scrape navigation data directly',
        description: 'Returns scraped navigation data immediately without creating a job'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Navigation data scraped successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                count: { type: 'number' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            slug: { type: 'string' },
                            url: { type: 'string' }
                        }
                    }
                },
                timestamp: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeNavigationLive", null);
__decorate([
    (0, common_1.Get)('live/categories'),
    (0, swagger_1.ApiOperation)({
        summary: 'Scrape categories data directly',
        description: 'Returns scraped category data immediately from a specific URL'
    }),
    (0, swagger_1.ApiQuery)({ name: 'url', description: 'Category URL to scrape from', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'maxDepth', description: 'Maximum depth to scrape', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Category data scraped successfully'
    }),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Query)('maxDepth')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeCategoriesLive", null);
__decorate([
    (0, common_1.Get)('live/products'),
    (0, swagger_1.ApiOperation)({
        summary: 'Scrape products data directly',
        description: 'Returns scraped product data immediately from a specific category URL'
    }),
    (0, swagger_1.ApiQuery)({ name: 'url', description: 'Product list URL to scrape from', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'maxPages', description: 'Maximum pages to scrape', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product data scraped successfully'
    }),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Query)('maxPages')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeProductsLive", null);
__decorate([
    (0, common_1.Get)('live/product-detail'),
    (0, swagger_1.ApiOperation)({
        summary: 'Scrape product detail data directly',
        description: 'Returns scraped product detail data immediately from a specific product URL'
    }),
    (0, swagger_1.ApiQuery)({ name: 'url', description: 'Product URL to scrape from', required: true }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product detail data scraped successfully'
    }),
    __param(0, (0, common_1.Query)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeProductDetailLive", null);
__decorate([
    (0, common_1.Post)('live/scrape-and-save'),
    (0, swagger_1.ApiOperation)({
        summary: 'Scrape data and save to database',
        description: 'Performs complete scraping workflow and saves data to database'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Scraping and saving completed successfully'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "scrapeAndSave", null);
__decorate([
    (0, common_1.Post)('live/update-images'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update missing product images',
        description: 'Scrapes and updates missing images for existing products'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Image update completed successfully'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "updateMissingImages", null);
__decorate([
    (0, common_1.Get)('live/verify-image'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify if an image URL is accessible',
        description: 'Checks if a given image URL returns a valid image'
    }),
    (0, swagger_1.ApiQuery)({ name: 'url', description: 'Image URL to verify', required: true }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Image verification result'
    }),
    __param(0, (0, common_1.Query)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "verifyImageUrl", null);
exports.ScrapingController = ScrapingController = __decorate([
    (0, swagger_1.ApiTags)('scraping'),
    (0, common_1.Controller)('scraping'),
    __metadata("design:paramtypes", [scraping_service_1.ScrapingService,
        world_of_books_scraper_service_1.WorldOfBooksScraperService,
        startup_scraping_service_1.StartupScrapingService])
], ScrapingController);
//# sourceMappingURL=scraping.controller.js.map