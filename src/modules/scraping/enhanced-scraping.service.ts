import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CacheService } from '../../common/services/cache.service';
import { EthicalScraperService } from './ethical-scraper.service';

interface ScrapingJob {
  id: string;
  type: 'navigation' | 'category' | 'product_list' | 'product_detail';
  url: string;
  priority: number;
  metadata: Record<string, any>;
  retryCount: number;
  maxRetries: number;
}

interface ScrapingResult {
  success: boolean;
  data?: any;
  error?: string;
  itemsProcessed: number;
  processingTime: number;
}

interface AdaptiveRateConfig {
  delay: number;
  successRate: number;
  avgResponseTime: number;
}

@Injectable()
export class EnhancedScrapingService {
  private readonly logger = new Logger(EnhancedScrapingService.name);
  
  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    private ethicalScraper: EthicalScraperService,
    @InjectQueue('scraping') private scrapingQueue: Queue,
    @InjectQueue('priority-scraping') private priorityQueue: Queue,
  ) {}

  async orchestrateScraping(options: {
    fullRefresh?: boolean;
    categories?: string[];
    maxDepth?: number;
    priority?: 'low' | 'normal' | 'high';
  } = {}): Promise<void> {
    this.logger.log('Starting intelligent scraping orchestration');

    try {
      const scrapingPlan = await this.createScrapingPlan(options);
      
      await this.executeScrapingPlan(scrapingPlan);
      
      this.logger.log('Scraping orchestration completed successfully');
    } catch (error) {
      this.logger.error('Scraping orchestration failed:', error);
      throw error;
    }
  }

  private async createScrapingPlan(options: any): Promise<ScrapingJob[]> {
    const jobs: ScrapingJob[] = [];
    const now = new Date();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    const navigationFreshness = await this.checkDataFreshness('navigation');
    if (options.fullRefresh || navigationFreshness.isStale) {
      jobs.push({
        id: `nav_${Date.now()}`,
        type: 'navigation',
        url: 'https://www.worldofbooks.com',
        priority: 10, // Highest priority
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

  private async executeScrapingPlan(jobs: ScrapingJob[]): Promise<void> {
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


  private async queueJob(job: ScrapingJob): Promise<void> {
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


  private calculateDelay(job: ScrapingJob): number {
    const baseDelay = {
      'navigation': 0,
      'category': 1000,
      'product_list': 2000,
      'product_detail': 3000
    };

    return baseDelay[job.type] || 1000;
  }

  private async checkDataFreshness(entityType: string): Promise<{
    isStale: boolean;
    lastUpdate: Date | null;
    stalenessScore: number;
  }> {
    const cacheKey = `freshness_${entityType}`;
    
    const cached = await this.cacheService.get(cacheKey);
    if (cached && typeof cached === 'object' && 'isStale' in cached) {
      return cached as {
        isStale: boolean;
        lastUpdate: Date | null;
        stalenessScore: number;
      };
    }

    let lastUpdate: Date | null = null;
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
    } else {
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

  private async getStaleCategories(): Promise<Array<{
    id: number;
    url: string;
    navigationId: number;
  }>> {
    return [];
  }


  private async getStaleProducts(categories?: string[]): Promise<Array<{
    id: number;
    url: string;
    categoryId: number;
    popularity: number;
  }>> {
    return [];
  }


  private async prioritizeProducts(products: Array<{
    id: number;
    url: string;
    categoryId: number;
    popularity: number;
  }>): Promise<Array<{
    id: number;
    url: string;
    categoryId: number;
    priority: number;
  }>> {
    return products.map(product => ({
      ...product,
      priority: this.calculateProductPriority(product)
    }));
  }

  private calculateProductPriority(product: {
    popularity: number;
    categoryId: number;
  }): number {
    let priority = 5; 

    priority += Math.min(product.popularity * 2, 3);

    const highPriorityCategories = [1, 2, 3]; 
    if (highPriorityCategories.includes(product.categoryId)) {
      priority += 2;
    }

    return Math.min(priority, 10); 
  }

  private async getLastUpdateTime(tableName: string): Promise<Date | null> {
    return new Date();
  }

  async adaptiveRateLimit(domain: string, responseTime: number, success: boolean): Promise<void> {
    const key = `adaptive_rate_${domain}`;
    const cached = await this.cacheService.get(key);
    const current: AdaptiveRateConfig = cached as AdaptiveRateConfig || {
      delay: 1000,
      successRate: 1.0,
      avgResponseTime: 1000
    };

    if (!success) {
      current.delay = Math.min(current.delay * 1.5, 10000); 
      current.successRate = current.successRate * 0.9;
    } else if (responseTime > 5000) {
      current.delay = Math.min(current.delay * 1.2, 10000); 
    } else if (responseTime < 1000 && current.successRate > 0.95) {
      current.delay = Math.max(current.delay * 0.9, 500); 
    }

    current.avgResponseTime = (current.avgResponseTime * 0.8) + (responseTime * 0.2);
    current.successRate = Math.max(current.successRate, 0.1);

    await this.cacheService.set(key, current, { ttl: 3600 });
    
    await this.delay(current.delay);
  }


  async isDuplicate(url: string, content: string): Promise<boolean> {
    const contentHash = this.hashContent(content);
    const cacheKey = `content_hash_${url}`;
    
    const existingHash = await this.cacheService.get(cacheKey);
    
    if (existingHash === contentHash) {
      return true; 
    }

    await this.cacheService.set(cacheKey, contentHash, { ttl: 86400 }); // 24 hours
    return false;
  }

  async getScrapingHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: any;
    recommendations: string[];
  }> {
    const [queueStats, recentJobs] = await Promise.all([
      this.getQueueStats(),
      this.getRecentJobStats()
    ]);

    const recommendations: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

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

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; 
    }
    return hash.toString();
  }

  private async getQueueStats(): Promise<any> {
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

  private async getRecentJobStats(): Promise<any> {
    return {
      avgResponseTime: 2000,
      successRate: 0.95,
      itemsPerHour: 1000
    };
  }
}