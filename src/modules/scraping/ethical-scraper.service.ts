import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface RobotsTxtRules {
  userAgent: string;
  disallowed: string[];
  allowed: string[];
  crawlDelay?: number;
  sitemaps: string[];
}

interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

@Injectable()
export class EthicalScraperService {
  private readonly logger = new Logger(EthicalScraperService.name);
  private robotsCache = new Map<string, RobotsTxtRules>();
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  private readonly defaultRateLimit: RateLimitConfig = {
    requestsPerSecond: 1,
    requestsPerMinute: 30,
    requestsPerHour: 1000,
    burstLimit: 5
  };

  constructor(
    private configService: ConfigService,
    @InjectQueue('scraping') private scrapingQueue: Queue,
  ) {}

  async checkRobotsTxt(domain: string): Promise<RobotsTxtRules> {
    if (this.robotsCache.has(domain)) {
      return this.robotsCache.get(domain)!;
    }

    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await fetch(robotsUrl, { 
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'ProductExplorer/1.0 (+https://example.com/bot)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      const rules = this.parseRobotsTxt(content);
      
      this.robotsCache.set(domain, rules);
      setTimeout(() => this.robotsCache.delete(domain), 24 * 60 * 60 * 1000);
      
      return rules;
    } catch (error) {
      this.logger.warn(`Failed to fetch robots.txt for ${domain}:`, error.message);
      
      const defaultRules: RobotsTxtRules = {
        userAgent: '*',
        disallowed: [],
        allowed: ['*'],
        crawlDelay: 1,
        sitemaps: []
      };
      
      this.robotsCache.set(domain, defaultRules);
      return defaultRules;
    }
  }

  private parseRobotsTxt(content: string): RobotsTxtRules {
    const lines = content.split('\n').map(line => line.trim());
    const rules: RobotsTxtRules = {
      userAgent: '*',
      disallowed: [],
      allowed: [],
      sitemaps: []
    };

    let currentUserAgent = '*';
    
    for (const line of lines) {
      if (line.startsWith('#') || !line) continue;
      
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      switch (key.toLowerCase()) {
        case 'user-agent':
          currentUserAgent = value;
          if (value === '*' || value.toLowerCase().includes('bot')) {
            rules.userAgent = value;
          }
          break;
        case 'disallow':
          if (currentUserAgent === rules.userAgent) {
            rules.disallowed.push(value);
          }
          break;
        case 'allow':
          if (currentUserAgent === rules.userAgent) {
            rules.allowed.push(value);
          }
          break;
        case 'crawl-delay':
          if (currentUserAgent === rules.userAgent) {
            rules.crawlDelay = parseInt(value, 10) || 1;
          }
          break;
        case 'sitemap':
          rules.sitemaps.push(value);
          break;
      }
    }

    return rules;
  }

  async isUrlAllowed(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;
      
      const rules = await this.checkRobotsTxt(domain);
      
      for (const disallowed of rules.disallowed) {
        if (disallowed === '*' || path.startsWith(disallowed)) {
          return false;
        }
      }
      
      if (rules.allowed.length > 0) {
        return rules.allowed.some(allowed => 
          allowed === '*' || path.startsWith(allowed)
        );
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error checking URL permissions for ${url}:`, error);
      return false;
    }
  }

  async respectRateLimit(domain: string): Promise<void> {
    const now = Date.now();
    const key = `rate_limit_${domain}`;
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, { count: 0, resetTime: now + 60000 });
    }
    
    const rateLimit = this.requestCounts.get(key)!;
    
    if (now > rateLimit.resetTime) {
      rateLimit.count = 0;
      rateLimit.resetTime = now + 60000;
    }
    
    if (rateLimit.count >= this.defaultRateLimit.requestsPerMinute) {
      const waitTime = rateLimit.resetTime - now;
      this.logger.warn(`Rate limit exceeded for ${domain}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      rateLimit.count = 0;
      rateLimit.resetTime = now + 60000;
    }
    
    rateLimit.count++;
    
    const robots = await this.checkRobotsTxt(domain);
    const delay = (robots.crawlDelay || 1) * 1000;
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  async queueEthicalScrape(url: string, options: any = {}) {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    const isAllowed = await this.isUrlAllowed(url);
    if (!isAllowed) {
      throw new Error(`Scraping not allowed for ${url} according to robots.txt`);
    }
    
    await this.scrapingQueue.add('ethical-scrape', {
      url,
      domain,
      options,
      timestamp: Date.now()
    }, {
      delay: 0, 
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50
    });
  }

  async getScrapingStats(domain?: string) {
    const jobs = await this.scrapingQueue.getJobs(['completed', 'failed', 'active', 'waiting']);
    
    const stats = {
      total: jobs.length,
      completed: 0,
      failed: 0,
      active: 0,
      waiting: 0,
      byDomain: {} as Record<string, number>
    };
    
    for (const job of jobs) {
      stats[job.opts.jobId as keyof typeof stats]++;
      
      if (job.data.domain) {
        stats.byDomain[job.data.domain] = (stats.byDomain[job.data.domain] || 0) + 1;
      }
    }
    
    return domain ? { [domain]: stats.byDomain[domain] || 0 } : stats;
  }
}