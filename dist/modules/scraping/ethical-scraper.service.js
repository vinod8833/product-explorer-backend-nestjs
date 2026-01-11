"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EthicalScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthicalScraperService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
let EthicalScraperService = EthicalScraperService_1 = class EthicalScraperService {
    constructor(configService, scrapingQueue) {
        this.configService = configService;
        this.scrapingQueue = scrapingQueue;
        this.logger = new common_1.Logger(EthicalScraperService_1.name);
        this.robotsCache = new Map();
        this.requestCounts = new Map();
        this.defaultRateLimit = {
            requestsPerSecond: 1,
            requestsPerMinute: 30,
            requestsPerHour: 1000,
            burstLimit: 5
        };
    }
    async checkRobotsTxt(domain) {
        if (this.robotsCache.has(domain)) {
            return this.robotsCache.get(domain);
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
        }
        catch (error) {
            this.logger.warn(`Failed to fetch robots.txt for ${domain}:`, error.message);
            const defaultRules = {
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
    parseRobotsTxt(content) {
        const lines = content.split('\n').map(line => line.trim());
        const rules = {
            userAgent: '*',
            disallowed: [],
            allowed: [],
            sitemaps: []
        };
        let currentUserAgent = '*';
        for (const line of lines) {
            if (line.startsWith('#') || !line)
                continue;
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
    async isUrlAllowed(url) {
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
                return rules.allowed.some(allowed => allowed === '*' || path.startsWith(allowed));
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Error checking URL permissions for ${url}:`, error);
            return false;
        }
    }
    async respectRateLimit(domain) {
        const now = Date.now();
        const key = `rate_limit_${domain}`;
        if (!this.requestCounts.has(key)) {
            this.requestCounts.set(key, { count: 0, resetTime: now + 60000 });
        }
        const rateLimit = this.requestCounts.get(key);
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
    async queueEthicalScrape(url, options = {}) {
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
    async getScrapingStats(domain) {
        const jobs = await this.scrapingQueue.getJobs(['completed', 'failed', 'active', 'waiting']);
        const stats = {
            total: jobs.length,
            completed: 0,
            failed: 0,
            active: 0,
            waiting: 0,
            byDomain: {}
        };
        for (const job of jobs) {
            stats[job.opts.jobId]++;
            if (job.data.domain) {
                stats.byDomain[job.data.domain] = (stats.byDomain[job.data.domain] || 0) + 1;
            }
        }
        return domain ? { [domain]: stats.byDomain[domain] || 0 } : stats;
    }
};
exports.EthicalScraperService = EthicalScraperService;
exports.EthicalScraperService = EthicalScraperService = EthicalScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('scraping')),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], EthicalScraperService);
//# sourceMappingURL=ethical-scraper.service.js.map