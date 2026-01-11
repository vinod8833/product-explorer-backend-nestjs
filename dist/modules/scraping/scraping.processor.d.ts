import { Job } from 'bull';
import { ScrapingService } from './scraping.service';
import { WorldOfBooksScraperService } from './world-of-books-scraper.service';
export declare class ScrapingProcessor {
    private scrapingService;
    private worldOfBooksScraperService;
    private readonly logger;
    constructor(scrapingService: ScrapingService, worldOfBooksScraperService: WorldOfBooksScraperService);
    handleScrapeJob(job: Job): Promise<void>;
    private handleNavigationScrape;
    private handleCategoryScrape;
    private handleProductListScrape;
    private handleProductDetailScrape;
}
