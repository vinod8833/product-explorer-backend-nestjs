import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';

export enum ScrapeJobType {
  NAVIGATION = 'navigation',
  CATEGORY = 'category',
  PRODUCT_LIST = 'product_list',
  PRODUCT_DETAIL = 'product_detail',
}

export enum ScrapeJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class ScrapeJobDto {
  @ApiProperty({ description: 'Scrape job ID' })
  id: number;

  @ApiProperty({ description: 'Target URL to scrape' })
  targetUrl: string;

  @ApiProperty({ description: 'Type of scraping job', enum: ScrapeJobType })
  targetType: ScrapeJobType;

  @ApiProperty({ description: 'Job status', enum: ScrapeJobStatus })
  status: ScrapeJobStatus;

  @ApiPropertyOptional({ description: 'Job start timestamp' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Job completion timestamp' })
  finishedAt?: Date;

  @ApiPropertyOptional({ description: 'Error log if failed' })
  errorLog?: string;

  @ApiProperty({ description: 'Number of items scraped' })
  itemsScraped: number;

  @ApiProperty({ description: 'Number of retry attempts' })
  retryCount: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class CreateScrapeJobDto {
  @ApiProperty({ description: 'Target URL to scrape' })
  @IsUrl()
  targetUrl: string;

  @ApiProperty({ description: 'Type of scraping job', enum: ScrapeJobType })
  @IsEnum(ScrapeJobType)
  targetType: ScrapeJobType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ScrapeNavigationDto {
  @ApiProperty({ description: 'Base URL to scrape navigation from' })
  @IsUrl()
  baseUrl: string;
}

export class ScrapeCategoryDto {
  @ApiProperty({ description: 'Category URL to scrape' })
  @IsUrl()
  categoryUrl: string;

  @ApiPropertyOptional({ description: 'Navigation ID to associate with' })
  @IsOptional()
  navigationId?: number;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsOptional()
  parentId?: number;
}

export class ScrapeProductListDto {
  @ApiProperty({ description: 'Product list URL to scrape' })
  @IsUrl()
  productListUrl: string;

  @ApiPropertyOptional({ description: 'Category ID to associate products with' })
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Maximum number of pages to scrape' })
  @IsOptional()
  maxPages?: number;
}

export class ScrapeProductDetailDto {
  @ApiProperty({ description: 'Product detail URL to scrape' })
  @IsUrl()
  productUrl: string;

  @ApiPropertyOptional({ description: 'Product ID to update' })
  @IsOptional()
  productId?: number;
}

export class ScrapeStatsDto {
  @ApiProperty({ description: 'Total number of scrape jobs' })
  totalJobs: number;

  @ApiProperty({ description: 'Number of pending jobs' })
  pendingJobs: number;

  @ApiProperty({ description: 'Number of running jobs' })
  runningJobs: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  completedJobs: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failedJobs: number;

  @ApiProperty({ description: 'Total items scraped' })
  totalItemsScraped: number;

  @ApiProperty({ description: 'Last scrape timestamp' })
  lastScrapeAt?: Date;
}