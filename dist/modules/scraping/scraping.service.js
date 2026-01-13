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
var ScrapingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const typeorm_2 = require("typeorm");
const scrape_job_entity_1 = require("../../database/entities/scrape-job.entity");
const navigation_entity_1 = require("../../database/entities/navigation.entity");
const category_entity_1 = require("../../database/entities/category.entity");
const product_entity_1 = require("../../database/entities/product.entity");
const product_detail_entity_1 = require("../../database/entities/product-detail.entity");
const review_entity_1 = require("../../database/entities/review.entity");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ScrapingService = ScrapingService_1 = class ScrapingService {
    constructor(scrapeJobRepository, navigationRepository, categoryRepository, productRepository, productDetailRepository, reviewRepository, scrapingQueue) {
        this.scrapeJobRepository = scrapeJobRepository;
        this.navigationRepository = navigationRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productDetailRepository = productDetailRepository;
        this.reviewRepository = reviewRepository;
        this.scrapingQueue = scrapingQueue;
        this.logger = new common_1.Logger(ScrapingService_1.name);
    }
    async createScrapeJob(createScrapeJobDto) {
        const scrapeJob = this.scrapeJobRepository.create(createScrapeJobDto);
        const savedJob = await this.scrapeJobRepository.save(scrapeJob);
        await this.scrapingQueue.add('scrape', {
            jobId: savedJob.id,
            targetUrl: savedJob.targetUrl,
            targetType: savedJob.targetType,
            metadata: savedJob.metadata,
        });
        this.logger.log(`Created scrape job ${savedJob.id} for ${savedJob.targetUrl}`);
        return savedJob;
    }
    async findAllJobs(paginationDto) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const [jobs, total] = await this.scrapeJobRepository.findAndCount({
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return new pagination_dto_1.PaginatedResponseDto(jobs, total, page, limit);
    }
    async findJobById(id) {
        return this.scrapeJobRepository.findOne({ where: { id } });
    }
    async updateJobStatus(id, status, errorMessage, itemsProcessed) {
        const job = await this.scrapeJobRepository.findOne({ where: { id } });
        if (!job) {
            throw new Error(`Scrape job ${id} not found`);
        }
        job.status = status;
        if (errorMessage)
            job.errorMessage = errorMessage;
        if (itemsProcessed !== undefined)
            job.itemsProcessed = itemsProcessed;
        if (status === scrape_job_entity_1.ScrapeJobStatus.RUNNING && !job.startedAt) {
            job.startedAt = new Date();
        }
        if (status === scrape_job_entity_1.ScrapeJobStatus.COMPLETED || status === scrape_job_entity_1.ScrapeJobStatus.FAILED) {
            job.completedAt = new Date();
        }
        return this.scrapeJobRepository.save(job);
    }
    async getStats() {
        const totalJobs = await this.scrapeJobRepository.count();
        const pendingJobs = await this.scrapeJobRepository.count({
            where: { status: scrape_job_entity_1.ScrapeJobStatus.PENDING },
        });
        const runningJobs = await this.scrapeJobRepository.count({
            where: { status: scrape_job_entity_1.ScrapeJobStatus.RUNNING },
        });
        const completedJobs = await this.scrapeJobRepository.count({
            where: { status: scrape_job_entity_1.ScrapeJobStatus.COMPLETED },
        });
        const failedJobs = await this.scrapeJobRepository.count({
            where: { status: scrape_job_entity_1.ScrapeJobStatus.FAILED },
        });
        const totalItemsResult = await this.scrapeJobRepository
            .createQueryBuilder('job')
            .select('SUM(job.itemsProcessed)', 'total')
            .getRawOne();
        const lastScrapeResult = await this.scrapeJobRepository.findOne({
            where: { status: scrape_job_entity_1.ScrapeJobStatus.COMPLETED },
            order: { completedAt: 'DESC' },
        });
        return {
            totalJobs,
            pendingJobs,
            runningJobs,
            completedJobs,
            failedJobs,
            totalItemsScraped: parseInt(totalItemsResult?.total || '0', 10),
            lastScrapeAt: lastScrapeResult?.completedAt,
        };
    }
    async triggerNavigationScrape(baseUrl) {
        return this.createScrapeJob({
            targetUrl: baseUrl,
            targetType: scrape_job_entity_1.ScrapeJobType.NAVIGATION,
            metadata: { baseUrl },
        });
    }
    async triggerCategoryScrape(categoryUrl, navigationId, parentId) {
        return this.createScrapeJob({
            targetUrl: categoryUrl,
            targetType: scrape_job_entity_1.ScrapeJobType.CATEGORY,
            metadata: { navigationId, parentId },
        });
    }
    async triggerProductListScrape(productListUrl, categoryId, maxPages) {
        return this.createScrapeJob({
            targetUrl: productListUrl,
            targetType: scrape_job_entity_1.ScrapeJobType.PRODUCT_LIST,
            metadata: { categoryId, maxPages: maxPages || 5 },
        });
    }
    async triggerProductDetailScrape(productUrl, productId) {
        return this.createScrapeJob({
            targetUrl: productUrl,
            targetType: scrape_job_entity_1.ScrapeJobType.PRODUCT_DETAIL,
            metadata: { productId },
        });
    }
    async saveNavigationItems(items) {
        const savedItems = [];
        for (const item of items) {
            const existing = await this.navigationRepository.findOne({
                where: { slug: item.slug },
            });
            if (existing) {
                existing.title = item.title;
                existing.sourceUrl = item.url;
                existing.lastScrapedAt = new Date();
                savedItems.push(await this.navigationRepository.save(existing));
            }
            else {
                const navigation = this.navigationRepository.create({
                    title: item.title,
                    slug: item.slug,
                    sourceUrl: item.url,
                    lastScrapedAt: new Date(),
                });
                savedItems.push(await this.navigationRepository.save(navigation));
            }
        }
        return savedItems;
    }
    async saveCategoryItems(items, navigationId, parentId) {
        const savedItems = [];
        for (const item of items) {
            const existing = await this.categoryRepository.findOne({
                where: { slug: item.slug },
            });
            if (existing) {
                existing.title = item.title;
                existing.sourceUrl = item.url;
                existing.lastScrapedAt = new Date();
                if (navigationId)
                    existing.navigationId = navigationId;
                if (parentId)
                    existing.parentId = parentId;
                savedItems.push(await this.categoryRepository.save(existing));
            }
            else {
                const category = this.categoryRepository.create({
                    title: item.title,
                    slug: item.slug,
                    sourceUrl: item.url,
                    navigationId,
                    parentId,
                    lastScrapedAt: new Date(),
                });
                savedItems.push(await this.categoryRepository.save(category));
            }
        }
        return savedItems;
    }
    async saveProductItems(items, categoryId) {
        const savedItems = [];
        for (const item of items) {
            const existing = await this.productRepository.findOne({
                where: { sourceId: item.sourceId },
            });
            if (existing) {
                existing.title = item.title;
                existing.author = item.author;
                existing.price = item.price;
                existing.currency = item.currency;
                existing.imageUrl = item.imageUrl;
                existing.sourceUrl = item.sourceUrl;
                existing.inStock = item.inStock;
                existing.lastScrapedAt = new Date();
                if (categoryId)
                    existing.categoryId = categoryId;
                savedItems.push(await this.productRepository.save(existing));
            }
            else {
                const product = this.productRepository.create({
                    sourceId: item.sourceId,
                    title: item.title,
                    author: item.author,
                    price: item.price,
                    currency: item.currency,
                    imageUrl: item.imageUrl,
                    sourceUrl: item.sourceUrl,
                    inStock: item.inStock,
                    categoryId,
                    lastScrapedAt: new Date(),
                });
                savedItems.push(await this.productRepository.save(product));
            }
        }
        return savedItems;
    }
    async saveProductDetail(item, productId) {
        let product;
        if (productId) {
            product = await this.productRepository.findOne({ where: { id: productId } });
        }
        else {
            product = await this.productRepository.findOne({ where: { sourceId: item.sourceId } });
        }
        if (!product) {
            product = this.productRepository.create({
                sourceId: item.sourceId,
                title: item.title,
                author: item.author,
                price: item.price,
                currency: item.currency,
                imageUrl: item.imageUrl,
                sourceUrl: item.sourceUrl,
                inStock: item.inStock,
                lastScrapedAt: new Date(),
            });
            product = await this.productRepository.save(product);
        }
        else {
            product.title = item.title;
            product.author = item.author;
            product.price = item.price;
            product.currency = item.currency;
            product.imageUrl = item.imageUrl;
            product.sourceUrl = item.sourceUrl;
            product.inStock = item.inStock;
            product.lastScrapedAt = new Date();
            product = await this.productRepository.save(product);
        }
        let detail = await this.productDetailRepository.findOne({
            where: { productId: product.id },
        });
        if (detail) {
            detail.description = item.description;
            detail.specs = item.specs;
            detail.publisher = item.publisher;
            detail.publicationDate = item.publicationDate ? new Date(item.publicationDate) : null;
            detail.isbn = item.isbn;
            detail.pageCount = item.pageCount;
            detail.genres = item.genres;
        }
        else {
            detail = this.productDetailRepository.create({
                productId: product.id,
                description: item.description,
                specs: item.specs,
                publisher: item.publisher,
                publicationDate: item.publicationDate ? new Date(item.publicationDate) : null,
                isbn: item.isbn,
                pageCount: item.pageCount,
                genres: item.genres,
            });
        }
        await this.productDetailRepository.save(detail);
        if (item.reviews && item.reviews.length > 0) {
            await this.reviewRepository.delete({ productId: product.id });
            for (const reviewData of item.reviews) {
                const review = this.reviewRepository.create({
                    productId: product.id,
                    author: reviewData.author,
                    rating: reviewData.rating ? parseInt(reviewData.rating, 10) : null,
                    text: reviewData.text,
                    reviewDate: reviewData.reviewDate ? new Date(reviewData.reviewDate) : null,
                    helpfulCount: reviewData.helpfulCount || 0,
                });
                await this.reviewRepository.save(review);
            }
            const reviewStats = await this.reviewRepository
                .createQueryBuilder('review')
                .select('AVG(review.rating)', 'avg')
                .addSelect('COUNT(review.id)', 'count')
                .where('review.productId = :productId', { productId: product.id })
                .andWhere('review.rating IS NOT NULL')
                .getRawOne();
            detail.ratingsAvg = reviewStats.avg ? parseFloat(reviewStats.avg) : null;
            detail.reviewsCount = parseInt(reviewStats.count, 10);
            await this.productDetailRepository.save(detail);
        }
        return product;
    }
};
exports.ScrapingService = ScrapingService;
exports.ScrapingService = ScrapingService = ScrapingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(scrape_job_entity_1.ScrapeJob)),
    __param(1, (0, typeorm_1.InjectRepository)(navigation_entity_1.Navigation)),
    __param(2, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(4, (0, typeorm_1.InjectRepository)(product_detail_entity_1.ProductDetail)),
    __param(5, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(6, (0, bull_1.InjectQueue)('scraping')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], ScrapingService);
//# sourceMappingURL=scraping.service.js.map