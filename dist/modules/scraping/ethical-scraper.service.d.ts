import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
interface RobotsTxtRules {
    userAgent: string;
    disallowed: string[];
    allowed: string[];
    crawlDelay?: number;
    sitemaps: string[];
}
export declare class EthicalScraperService {
    private configService;
    private scrapingQueue;
    private readonly logger;
    private robotsCache;
    private requestCounts;
    private readonly defaultRateLimit;
    constructor(configService: ConfigService, scrapingQueue: Queue);
    checkRobotsTxt(domain: string): Promise<RobotsTxtRules>;
    private parseRobotsTxt;
    isUrlAllowed(url: string): Promise<boolean>;
    respectRateLimit(domain: string): Promise<void>;
    queueEthicalScrape(url: string, options?: any): Promise<void>;
    getScrapingStats(domain?: string): Promise<{
        total: number;
        completed: number;
        failed: number;
        active: number;
        waiting: number;
        byDomain: Record<string, number>;
    } | {
        [domain]: number;
    }>;
}
export {};
