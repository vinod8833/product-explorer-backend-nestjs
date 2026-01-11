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
var EnhancedScrapingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedScrapingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const cache_service_1 = require("../../common/services/cache.service");
const ethical_scraper_service_1 = require("./ethical-scraper.service");
let EnhancedScrapingService = EnhancedScrapingService_1 = class EnhancedScrapingService {
    constructor(configService, cacheService, ethicalScraper, scrapingQueue, priorityQueue) {
        this.configService = configService;
        this.cacheService = cacheService;
        this.ethicalScraper = ethicalScraper;
        this.scrapingQueue = scrapingQueue;
        this.priorityQueue = priorityQueue;
        this.logger = new common_1.Logger(EnhancedScrapingService_1.name);
    }
    async orchestrateScraping(options = {}) {
        this.logger.log('Starting intelligent scraping orchestration');
        try {
            const scrapingPlan = await this.createScrapingPlan(options);
            await this.executeScrapingPlan(scrapingPlan);
            this.logger.log('Scraping orchestration completed successfully');
        }
        catch (error) {
            this.logger.error('Scraping orchestration failed:', error);
            throw error;
        }
    }
    async createScrapingPlan(options) {
        const jobs = [];
        const now = new Date();
        const staleThreshold = 24 * 60 * 60 * 1000;
        const navigationFreshness = await this.checkDataFreshness('navigation');
        if (options.fullRefresh || navigationFreshness.isStale) {
            jobs.push({
                id: `nav_${Date.now()}`,
                type: 'navigation',
                url: 'https://www.worldofbooks.com',
                priority: 10,
                metadata: { fullRefresh: options.fullRefresh },
                retryCount: 0,
                maxRetries: 3
            });
        }
        const categoriesFreshness = await this.checkDataFreshness('categories');
        if (options.fullRefresh || categoriesFreshness.isStale) {
            const categoryUrls = await this.getStaleCategories();
            for (const categoryUrl of categoryUrls) {
                jobs.push({
                    id: `cat_${Date.now()}_${Math.random()}`,
                    type: 'category',
                    url: categoryUrl.url,
                    priority: 8,
                    metadata: {
                        categoryId: categoryUrl.id,
                        navigationId: categoryUrl.navigationId
                    },
                    retryCount: 0,
                    maxRetries: 3
                });
            }
        }
        const productsFreshness = await this.checkDataFreshness('products');
        if (options.fullRefresh || productsFreshness.isStale) {
            const productUrls = await this.getStaleProducts(options.categories);
            const prioritizedProducts = await this.prioritizeProducts(productUrls);
            for (const product of prioritizedProducts) {
                jobs.push({
                    id: `prod_${Date.now()}_${product.id}`,
                    type: 'product_detail',
                    url: product.url,
                    priority: product.priority,
                    metadata: {
                        productId: product.id,
                        categoryId: product.categoryId
                    },
                    retryCount: 0,
                    maxRetries: 2
                });
            }
        }
        this.logger.log(`Created scraping plan with ${jobs.length} jobs`);
        return jobs;
    }
    async executeScrapingPlan(jobs) {
        jobs.sort((a, b) => b.priority - a.priority);
        const batchSize = 10;
        const batches = this.chunkArray(jobs, batchSize);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            this.logger.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} jobs)`);
            const promises = batch.map(job => this.queueJob(job));
            await Promise.all(promises);
            if (i < batches.length - 1) {
                await this.delay(5000);
            }
        }
    }
    async queueJob(job) {
        const queue = job.priority >= 8 ? this.priorityQueue : this.scrapingQueue;
        await queue.add('scrape', job, {
            priority: job.priority,
            attempts: job.maxRetries + 1,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
            delay: this.calculateDelay(job)
        });
    }
    calculateDelay(job) {
        const baseDelay = {
            'navigation': 0,
            'category': 1000,
            'product_list': 2000,
            'product_detail': 3000
        };
        return baseDelay[job.type] || 1000;
    }
    async checkDataFreshness(entityType) {
        const cacheKey = `freshness_${entityType}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached && typeof cached === 'object' && 'isStale' in cached) {
            return cached;
        }
        let lastUpdate = null;
        let stalenessScore = 0;
        switch (entityType) {
            case 'navigation':
                lastUpdate = await this.getLastUpdateTime('navigation');
                break;
            case 'categories':
                lastUpdate = await this.getLastUpdateTime('category');
                break;
            case 'products':
                lastUpdate = await this.getLastUpdateTime('product');
                break;
        }
        if (lastUpdate) {
            const ageInHours = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
            stalenessScore = Math.min(ageInHours / 24, 1);
        }
        else {
            stalenessScore = 1;
        }
        const result = {
            isStale: stalenessScore > 0.5,
            lastUpdate,
            stalenessScore
        };
        await this.cacheService.set(cacheKey, result, { ttl: 3600 });
        return result;
    }
    async getStaleCategories() {
        return [];
    }
    async getStaleProducts(categories) {
        return [];
    }
    async prioritizeProducts(products) {
        return products.map(product => ({
            ...product,
            priority: this.calculateProductPriority(product)
        }));
    }
    calculateProductPriority(product) {
        let priority = 5;
        priority += Math.min(product.popularity * 2, 3);
        const highPriorityCategories = [1, 2, 3];
        if (highPriorityCategories.includes(product.categoryId)) {
            priority += 2;
        }
        return Math.min(priority, 10);
    }
    async getLastUpdateTime(tableName) {
        return new Date();
    }
    async adaptiveRateLimit(domain, responseTime, success) {
        const key = `adaptive_rate_${domain}`;
        const cached = await this.cacheService.get(key);
        const current = cached || {
            delay: 1000,
            successRate: 1.0,
            avgResponseTime: 1000
        };
        if (!success) {
            current.delay = Math.min(current.delay * 1.5, 10000);
            current.successRate = current.successRate * 0.9;
        }
        else if (responseTime > 5000) {
            current.delay = Math.min(current.delay * 1.2, 10000);
        }
        else if (responseTime < 1000 && current.successRate > 0.95) {
            current.delay = Math.max(current.delay * 0.9, 500);
        }
        current.avgResponseTime = (current.avgResponseTime * 0.8) + (responseTime * 0.2);
        current.successRate = Math.max(current.successRate, 0.1);
        await this.cacheService.set(key, current, { ttl: 3600 });
        await this.delay(current.delay);
    }
    async isDuplicate(url, content) {
        const contentHash = this.hashContent(content);
        const cacheKey = `content_hash_${url}`;
        const existingHash = await this.cacheService.get(cacheKey);
        if (existingHash === contentHash) {
            return true;
        }
        await this.cacheService.set(cacheKey, contentHash, { ttl: 86400 });
        return false;
    }
    async getScrapingHealth() {
        const [queueStats, recentJobs] = await Promise.all([
            this.getQueueStats(),
            this.getRecentJobStats()
        ]);
        const recommendations = [];
        let status = 'healthy';
        if (queueStats.waiting > 1000) {
            status = 'degraded';
            recommendations.push('High queue backlog detected. Consider scaling workers.');
        }
        if (queueStats.failed > queueStats.completed * 0.1) {
            status = 'unhealthy';
            recommendations.push('High failure rate detected. Check site accessibility and rate limits.');
        }
        if (recentJobs.avgResponseTime > 10000) {
            status = 'degraded';
            recommendations.push('Slow response times detected. Consider reducing concurrency.');
        }
        return {
            status,
            metrics: {
                queue: queueStats,
                performance: recentJobs
            },
            recommendations
        };
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    hashContent(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    async getQueueStats() {
        const [waiting, active, completed, failed] = await Promise.all([
            this.scrapingQueue.getWaiting(),
            this.scrapingQueue.getActive(),
            this.scrapingQueue.getCompleted(),
            this.scrapingQueue.getFailed()
        ]);
        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length
        };
    }
    async getRecentJobStats() {
        return {
            avgResponseTime: 2000,
            successRate: 0.95,
            itemsPerHour: 1000
        };
    }
};
exports.EnhancedScrapingService = EnhancedScrapingService;
exports.EnhancedScrapingService = EnhancedScrapingService = EnhancedScrapingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_1.InjectQueue)('scraping')),
    __param(4, (0, bull_1.InjectQueue)('priority-scraping')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        cache_service_1.CacheService,
        ethical_scraper_service_1.EthicalScraperService, Object, Object])
], EnhancedScrapingService);
//# sourceMappingURL=enhanced-scraping.service.js.map