import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { ScrapeJob, ScrapeJobType, ScrapeJobStatus } from '../../database/entities/scrape-job.entity';
import { Navigation } from '../../database/entities/navigation.entity';
import { Category } from '../../database/entities/category.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductDetail } from '../../database/entities/product-detail.entity';
import { Review } from '../../database/entities/review.entity';
import { CreateScrapeJobDto, ScrapeStatsDto } from './dto/scraping.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    @InjectRepository(ScrapeJob)
    private scrapeJobRepository: Repository<ScrapeJob>,
    @InjectRepository(Navigation)
    private navigationRepository: Repository<Navigation>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductDetail)
    private productDetailRepository: Repository<ProductDetail>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectQueue('scraping') private scrapingQueue: Queue,
  ) {}

  async createScrapeJob(createScrapeJobDto: CreateScrapeJobDto): Promise<ScrapeJob> {
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

  async findAllJobs(paginationDto: PaginationDto): Promise<PaginatedResponseDto<ScrapeJob>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [jobs, total] = await this.scrapeJobRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(jobs, total, page, limit);
  }

  async findJobById(id: number): Promise<ScrapeJob> {
    return this.scrapeJobRepository.findOne({ where: { id } });
  }

  async updateJobStatus(
    id: number,
    status: ScrapeJobStatus,
    errorMessage?: string,
    itemsProcessed?: number,
  ): Promise<ScrapeJob> {
    const job = await this.scrapeJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new Error(`Scrape job ${id} not found`);
    }

    job.status = status;
    if (errorMessage) job.errorMessage = errorMessage;
    if (itemsProcessed !== undefined) job.itemsProcessed = itemsProcessed;

    if (status === ScrapeJobStatus.RUNNING && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (status === ScrapeJobStatus.COMPLETED || status === ScrapeJobStatus.FAILED) {
      job.completedAt = new Date();
    }

    return this.scrapeJobRepository.save(job);
  }

  async getStats(): Promise<ScrapeStatsDto> {
    const totalJobs = await this.scrapeJobRepository.count();
    const pendingJobs = await this.scrapeJobRepository.count({
      where: { status: ScrapeJobStatus.PENDING },
    });
    const runningJobs = await this.scrapeJobRepository.count({
      where: { status: ScrapeJobStatus.RUNNING },
    });
    const completedJobs = await this.scrapeJobRepository.count({
      where: { status: ScrapeJobStatus.COMPLETED },
    });
    const failedJobs = await this.scrapeJobRepository.count({
      where: { status: ScrapeJobStatus.FAILED },
    });

    const totalItemsResult = await this.scrapeJobRepository
      .createQueryBuilder('job')
      .select('SUM(job.itemsProcessed)', 'total')
      .getRawOne();

    const lastScrapeResult = await this.scrapeJobRepository.findOne({
      where: { status: ScrapeJobStatus.COMPLETED },
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

  async triggerNavigationScrape(baseUrl: string): Promise<ScrapeJob> {
    return this.createScrapeJob({
      targetUrl: baseUrl,
      targetType: ScrapeJobType.NAVIGATION,
      metadata: { baseUrl },
    });
  }

  async triggerCategoryScrape(categoryUrl: string, navigationId?: number, parentId?: number): Promise<ScrapeJob> {
    return this.createScrapeJob({
      targetUrl: categoryUrl,
      targetType: ScrapeJobType.CATEGORY,
      metadata: { navigationId, parentId },
    });
  }

  async triggerProductListScrape(productListUrl: string, categoryId?: number, maxPages?: number): Promise<ScrapeJob> {
    return this.createScrapeJob({
      targetUrl: productListUrl,
      targetType: ScrapeJobType.PRODUCT_LIST,
      metadata: { categoryId, maxPages: maxPages || 5 },
    });
  }

  async triggerProductDetailScrape(productUrl: string, productId?: number): Promise<ScrapeJob> {
    return this.createScrapeJob({
      targetUrl: productUrl,
      targetType: ScrapeJobType.PRODUCT_DETAIL,
      metadata: { productId },
    });
  }

  async saveNavigationItems(items: any[]): Promise<Navigation[]> {
    const savedItems: Navigation[] = [];
    
    for (const item of items) {
      const existing = await this.navigationRepository.findOne({
        where: { slug: item.slug },
      });

      if (existing) {
        existing.title = item.title;
        existing.sourceUrl = item.url;
        existing.lastScrapedAt = new Date();
        savedItems.push(await this.navigationRepository.save(existing));
      } else {
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

  async saveCategoryItems(items: any[], navigationId?: number, parentId?: number): Promise<Category[]> {
    const savedItems: Category[] = [];
    
    for (const item of items) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: item.slug },
      });

      if (existing) {
        existing.title = item.title;
        existing.sourceUrl = item.url;
        existing.lastScrapedAt = new Date();
        if (navigationId) existing.navigationId = navigationId;
        if (parentId) existing.parentId = parentId;
        savedItems.push(await this.categoryRepository.save(existing));
      } else {
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

  async saveProductItems(items: any[], categoryId?: number): Promise<Product[]> {
    const savedItems: Product[] = [];
    
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
        if (categoryId) existing.categoryId = categoryId;
        savedItems.push(await this.productRepository.save(existing));
      } else {
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

  async saveProductDetail(item: any, productId?: number): Promise<Product> {
    let product: Product;

    if (productId) {
      product = await this.productRepository.findOne({ where: { id: productId } });
    } else {
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
    } else {
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
    } else {
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
}