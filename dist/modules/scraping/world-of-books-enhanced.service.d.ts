import { ConfigService } from '@nestjs/config';
import { ProductItem, ProductDetailItem } from './world-of-books-scraper.service';
export declare class WorldOfBooksEnhancedService {
    private configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly userAgent;
    private readonly delayMin;
    private readonly delayMax;
    constructor(configService: ConfigService);
    private randomDelay;
    private createCrawlerConfig;
    scrapeCollectionBooks(collectionUrl: string, maxPages?: number): Promise<ProductItem[]>;
    scrapeProductDetails(productUrl: string): Promise<ProductDetailItem | null>;
    testSiteAccess(): Promise<{
        accessible: boolean;
        title: string;
        error?: string;
    }>;
}
