import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScrapingService } from './scraping.service';
import { WorldOfBooksScraperService } from './world-of-books-scraper.service';
import { ScrapeJobType, ScrapeJobStatus } from '../../database/entities/scrape-job.entity';

@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(
    private scrapingService: ScrapingService,
    private worldOfBooksScraperService: WorldOfBooksScraperService,
  ) {}

  @Process('scrape')
  async handleScrapeJob(job: Job) {
    const { jobId, targetUrl, targetType, metadata } = job.data;
    
    this.logger.log(`Processing scrape job ${jobId}: ${targetType} - ${targetUrl}`);

    try {
      await this.scrapingService.updateJobStatus(jobId, ScrapeJobStatus.RUNNING);

      let itemsScraped = 0;

      switch (targetType) {
        case ScrapeJobType.NAVIGATION:
          itemsScraped = await this.handleNavigationScrape(jobId, targetUrl, metadata);
          break;

        case ScrapeJobType.CATEGORY:
          itemsScraped = await this.handleCategoryScrape(jobId, targetUrl, metadata);
          break;

        case ScrapeJobType.PRODUCT_LIST:
          itemsScraped = await this.handleProductListScrape(jobId, targetUrl, metadata);
          break;

        case ScrapeJobType.PRODUCT_DETAIL:
          itemsScraped = await this.handleProductDetailScrape(jobId, targetUrl, metadata);
          break;

        default:
          throw new Error(`Unknown scrape job type: ${targetType}`);
      }

      await this.scrapingService.updateJobStatus(
        jobId,
        ScrapeJobStatus.COMPLETED,
        null,
        itemsScraped,
      );

      this.logger.log(`Completed scrape job ${jobId}: scraped ${itemsScraped} items`);
    } catch (error) {
      this.logger.error(`Failed scrape job ${jobId}: ${error.message}`, error.stack);
      
      await this.scrapingService.updateJobStatus(
        jobId,
        ScrapeJobStatus.FAILED,
        error.message,
      );

      throw error;
    }
  }

  private async handleNavigationScrape(jobId: number, targetUrl: string, metadata: any): Promise<number> {
    const items = await this.worldOfBooksScraperService.scrapeNavigation();
    const savedItems = await this.scrapingService.saveNavigationItems(items);
    
    for (const item of savedItems) {
      if (item.sourceUrl) {
        await this.scrapingService.triggerCategoryScrape(item.sourceUrl, item.id);
      }
    }

    return savedItems.length;
  }

  private async handleCategoryScrape(jobId: number, targetUrl: string, metadata: any): Promise<number> {
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

  private async handleProductListScrape(jobId: number, targetUrl: string, metadata: any): Promise<number> {
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

  private async handleProductDetailScrape(jobId: number, targetUrl: string, metadata: any): Promise<number> {
    const { productId } = metadata;
    const item = await this.worldOfBooksScraperService.scrapeProductDetail(targetUrl);
    
    if (item) {
      await this.scrapingService.saveProductDetail(item, productId);
      return 1;
    }

    return 0;
  }
}