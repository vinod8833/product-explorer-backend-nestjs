import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { CacheService } from '../../common/services/cache.service';
import { EthicalScraperService } from './ethical-scraper.service';
export declare class EnhancedScrapingService {
    private configService;
    private cacheService;
    private ethicalScraper;
    private scrapingQueue;
    private priorityQueue;
    private readonly logger;
    constructor(configService: ConfigService, cacheService: CacheService, ethicalScraper: EthicalScraperService, scrapingQueue: Queue, priorityQueue: Queue);
    orchestrateScraping(options?: {
        fullRefresh?: boolean;
        categories?: string[];
        maxDepth?: number;
        priority?: 'low' | 'normal' | 'high';
    }): Promise<void>;
    private createScrapingPlan;
    private executeScrapingPlan;
    private queueJob;
    private calculateDelay;
    private checkDataFreshness;
    private getStaleCategories;
    private getStaleProducts;
    private prioritizeProducts;
    private calculateProductPriority;
    private getLastUpdateTime;
    adaptiveRateLimit(domain: string, responseTime: number, success: boolean): Promise<void>;
    isDuplicate(url: string, content: string): Promise<boolean>;
    getScrapingHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: any;
        recommendations: string[];
    }>;
    private chunkArray;
    private delay;
    private hashContent;
    private getQueueStats;
    private getRecentJobStats;
}
