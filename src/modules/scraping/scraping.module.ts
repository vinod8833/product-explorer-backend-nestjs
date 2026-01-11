import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { WorldOfBooksScraperService } from './world-of-books-scraper.service';
import { WorldOfBooksApiService } from './world-of-books-api.service';
import { WorldOfBooksEnhancedService } from './world-of-books-enhanced.service';
import { ScrapingProcessor } from './scraping.processor';
import { ScrapeJob } from '../../database/entities/scrape-job.entity';
import { Navigation } from '../../database/entities/navigation.entity';
import { Category } from '../../database/entities/category.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductDetail } from '../../database/entities/product-detail.entity';
import { Review } from '../../database/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScrapeJob,
      Navigation,
      Category,
      Product,
      ProductDetail,
      Review,
    ]),
    BullModule.registerQueue({
      name: 'scraping',
    }),
  ],
  controllers: [ScrapingController],
  providers: [
    ScrapingService, 
    WorldOfBooksScraperService, 
    WorldOfBooksApiService,
    WorldOfBooksEnhancedService,
    ScrapingProcessor
  ],
  exports: [
    ScrapingService, 
    WorldOfBooksScraperService, 
    WorldOfBooksApiService,
    WorldOfBooksEnhancedService
  ],
})
export class ScrapingModule {}