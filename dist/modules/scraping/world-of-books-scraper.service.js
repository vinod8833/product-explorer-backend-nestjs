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
var WorldOfBooksScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldOfBooksScraperService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crawlee_1 = require("crawlee");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const sanitization_util_1 = require("../../common/utils/sanitization.util");
const axios_1 = require("axios");
let WorldOfBooksScraperService = WorldOfBooksScraperService_1 = class WorldOfBooksScraperService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WorldOfBooksScraperService_1.name);
        this.baseUrl = this.configService.get('WOB_BASE_URL', 'https://www.worldofbooks.com');
        this.userAgent = this.configService.get('WOB_USER_AGENT', 'Mozilla/5.0 (compatible; ProductExplorer/1.0)');
        this.delayMin = this.configService.get('SCRAPING_DELAY_MIN', 1000);
        this.delayMax = this.configService.get('SCRAPING_DELAY_MAX', 3000);
        this.maxRetries = this.configService.get('SCRAPING_MAX_RETRIES', 3);
        this.timeout = this.configService.get('SCRAPING_TIMEOUT', 30000);
        this.respectRobotsTxt = this.configService.get('SCRAPING_RESPECT_ROBOTS', true);
        this.proxyUrls = this.configService.get('SCRAPING_PROXY_URLS', '').split(',').filter(Boolean);
    }
    async verifyImageUrl(imageUrl) {
        if (!imageUrl)
            return false;
        try {
            const response = await axios_1.default.head(imageUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': this.userAgent
                }
            });
            const contentType = response.headers['content-type'];
            const isValidImage = contentType && contentType.startsWith('image/');
            const isValidStatus = response.status >= 200 && response.status < 300;
            this.logger.debug(`Image verification for ${imageUrl}: ${isValidImage && isValidStatus ? 'VALID' : 'INVALID'}`);
            return isValidImage && isValidStatus;
        }
        catch (error) {
            this.logger.warn(`Image verification failed for ${imageUrl}: ${error.message}`);
            return false;
        }
    }
    async validateProductData(product) {
        const missingFields = [];
        if (!product.title)
            missingFields.push('title');
        if (!product.author)
            missingFields.push('author');
        if (!product.price)
            missingFields.push('price');
        if (!product.sourceUrl)
            missingFields.push('sourceUrl');
        if (!product.imageUrl) {
            missingFields.push('imageUrl');
        }
        else {
            const isImageValid = await this.verifyImageUrl(product.imageUrl);
            if (!isImageValid) {
                missingFields.push('validImageUrl');
            }
        }
        const isValid = missingFields.length === 0;
        this.logger.debug(`Product validation for ${product.sourceId}: ${isValid ? 'VALID' : 'INVALID'} (missing: ${missingFields.join(', ')})`);
        return { isValid, missingFields };
    }
    async scrapeProductWithFallback(sourceId, existingProduct) {
        try {
            if (existingProduct) {
                const validation = await this.validateProductData(existingProduct);
                if (validation.isValid) {
                    this.logger.debug(`Product ${sourceId} has valid data, no scraping needed`);
                    return existingProduct;
                }
                this.logger.log(`Product ${sourceId} has invalid/missing data (${validation.missingFields.join(', ')}), triggering scrape`);
            }
            let scrapedProduct = null;
            const productUrl = this.constructProductUrl(sourceId);
            if (productUrl) {
                try {
                    scrapedProduct = await this.scrapeProductDetail(productUrl);
                    if (scrapedProduct) {
                        this.logger.log(`Successfully scraped fresh data for product ${sourceId} from constructed URL`);
                        return scrapedProduct;
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to scrape from constructed URL for ${sourceId}: ${error.message}`);
                }
            }
            if (existingProduct?.title) {
                try {
                    scrapedProduct = await this.searchAndScrapeProduct(existingProduct.title, existingProduct.author);
                    if (scrapedProduct) {
                        this.logger.log(`Successfully found and scraped product ${sourceId} via search`);
                        return scrapedProduct;
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to search and scrape product ${sourceId}: ${error.message}`);
                }
            }
            if (existingProduct) {
                const mockImageUrl = this.getMockImageUrl(existingProduct.title);
                if (mockImageUrl) {
                    this.logger.log(`Using mock image URL for product ${sourceId}`);
                    return {
                        ...existingProduct,
                        imageUrl: mockImageUrl
                    };
                }
            }
            this.logger.warn(`All scraping attempts failed for product ${sourceId}`);
            return existingProduct || null;
        }
        catch (error) {
            this.logger.error(`Error in scrapeProductWithFallback for ${sourceId}: ${error.message}`);
            return existingProduct || null;
        }
    }
    async searchAndScrapeProduct(title, author) {
        try {
            const searchQuery = author ? `${title} ${author}` : title;
            const searchUrl = `${this.baseUrl}/en-gb/search?q=${encodeURIComponent(searchQuery)}`;
            this.logger.debug(`Searching for product: ${searchQuery}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Error searching for product "${title}": ${error.message}`);
            return null;
        }
    }
    getMockImageUrl(title) {
        const mockImages = {
            'The Great Gatsby': 'https://images-na.ssl-images-amazon.com/images/I/81af+MCATTL.jpg',
            'To Kill a Mockingbird': 'https://images-na.ssl-images-amazon.com/images/I/71FxgtFKcQL.jpg',
            'Sapiens': 'https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL.jpg',
            'Pride and Prejudice': 'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
            '1984': 'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
            'Harry Potter': 'https://images-na.ssl-images-amazon.com/images/I/81YOuOGFCJL.jpg'
        };
        if (mockImages[title]) {
            return mockImages[title];
        }
        for (const [key, url] of Object.entries(mockImages)) {
            if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
                return url;
            }
        }
        return null;
    }
    constructProductUrl(sourceId) {
        try {
            if (sourceId.startsWith('http')) {
                return sourceId;
            }
            const cleanSourceId = sourceId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
            const constructedUrl = `${this.baseUrl}/en-gb/books/${cleanSourceId}`;
            this.logger.debug(`Constructed URL for ${sourceId}: ${constructedUrl}`);
            return constructedUrl;
        }
        catch (error) {
            this.logger.error(`Error constructing product URL for ${sourceId}: ${error.message}`);
            return null;
        }
    }
    async scrapeOrGenerateImageUrl(product) {
        try {
            if (product.sourceUrl) {
                try {
                    const scrapedProduct = await this.scrapeProductDetail(product.sourceUrl);
                    if (scrapedProduct?.imageUrl) {
                        const isValid = await this.verifyImageUrl(scrapedProduct.imageUrl);
                        if (isValid) {
                            this.logger.log(`Successfully scraped image for ${product.title}`);
                            return scrapedProduct.imageUrl;
                        }
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to scrape image from source URL for ${product.title}: ${error.message}`);
                }
            }
            const mockImageUrl = this.getMockImageUrl(product.title);
            if (mockImageUrl) {
                const isValid = await this.verifyImageUrl(mockImageUrl);
                if (isValid) {
                    this.logger.log(`Using verified mock image for ${product.title}`);
                    return mockImageUrl;
                }
            }
            const placeholderUrl = this.generatePlaceholderImageUrl(product.title);
            this.logger.log(`Generated placeholder image for ${product.title}`);
            return placeholderUrl;
        }
        catch (error) {
            this.logger.error(`Error scraping/generating image URL for ${product.title}: ${error.message}`);
            return this.generatePlaceholderImageUrl(product.title);
        }
    }
    generatePlaceholderImageUrl(title) {
        const encodedTitle = encodeURIComponent(title.substring(0, 50));
        return `https://via.placeholder.com/300x400/2563eb/ffffff?text=${encodedTitle}`;
    }
    async scrapeProductsWithImageVerification(url, maxPages = 10) {
        const products = await this.scrapeProducts(url, maxPages);
        const verifiedProducts = [];
        for (const product of products) {
            const validation = await this.validateProductData(product);
            if (!validation.isValid && validation.missingFields.includes('validImageUrl')) {
                try {
                    const detailedProduct = await this.scrapeProductWithFallback(product.sourceId, product);
                    if (detailedProduct) {
                        verifiedProducts.push(detailedProduct);
                    }
                    else {
                        verifiedProducts.push(product);
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to get detailed product data for ${product.sourceId}: ${error.message}`);
                    verifiedProducts.push(product);
                }
            }
            else {
                verifiedProducts.push(product);
            }
        }
        this.logger.log(`Verified ${verifiedProducts.length} products with image validation`);
        return verifiedProducts;
    }
    async checkRobotsTxt(url) {
        if (!this.respectRobotsTxt)
            return true;
        try {
            const robotsUrl = new URL('/robots.txt', url).toString();
            const response = await fetch(robotsUrl);
            if (!response.ok)
                return true;
            const robotsText = await response.text();
            const userAgentSection = robotsText.match(/User-agent:\s*\*[\s\S]*?(?=User-agent:|$)/i);
            if (userAgentSection) {
                const disallowRules = userAgentSection[0].match(/Disallow:\s*(.+)/gi);
                if (disallowRules) {
                    const path = new URL(url).pathname;
                    return !disallowRules.some(rule => {
                        const disallowPath = rule.replace(/Disallow:\s*/i, '').trim();
                        return path.startsWith(disallowPath);
                    });
                }
            }
            return true;
        }
        catch (error) {
            this.logger.warn(`Failed to check robots.txt for ${url}: ${error.message}`);
            return true;
        }
    }
    createCrawlerConfig() {
        const config = {
            launchContext: {
                launchOptions: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                    ],
                },
            },
            requestHandlerTimeoutSecs: this.timeout / 1000,
            maxRequestRetries: this.maxRetries,
            navigationTimeoutSecs: this.timeout / 1000,
            maxConcurrency: 1,
            minConcurrency: 1,
        };
        if (this.proxyUrls.length > 0) {
            config.proxyConfiguration = new crawlee_1.ProxyConfiguration({
                proxyUrls: this.proxyUrls,
            });
        }
        return config;
    }
    async randomDelay() {
        const delay = Math.floor(Math.random() * (this.delayMax - this.delayMin + 1)) + this.delayMin;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    async safePageEvaluation(page, evaluation, fallback, context) {
        try {
            return await page.evaluate(evaluation);
        }
        catch (error) {
            this.logger.warn(`Page evaluation failed in ${context}: ${error.message}`);
            return fallback;
        }
    }
    generateSlug(title) {
        return sanitization_util_1.SanitizationUtil.generateSlug(title);
    }
    async scrapeNavigation() {
        this.logger.log('Starting navigation scraping');
        const results = [];
        if (!(await this.checkRobotsTxt(this.baseUrl))) {
            throw new custom_exceptions_1.ScrapingException('Scraping not allowed by robots.txt');
        }
        const crawler = new crawlee_1.PlaywrightCrawler({
            ...this.createCrawlerConfig(),
            requestHandler: async ({ page }) => {
                await this.randomDelay();
                try {
                    this.logger.debug(`Scraping navigation from: ${this.baseUrl}`);
                    await page.setExtraHTTPHeaders({
                        'User-Agent': this.userAgent,
                    });
                    await page.waitForLoadState('networkidle', { timeout: this.timeout });
                    const navItems = await this.safePageEvaluation(page, () => {
                        const links = Array.from(document.querySelectorAll('nav a, .navigation a, .main-nav a'));
                        return links
                            .filter(link => {
                            const href = link.getAttribute('href');
                            return href && (href.includes('/categories/') || href.includes('/books/') || href.includes('/shop/'));
                        })
                            .map(link => ({
                            title: link.textContent?.trim() || '',
                            url: link.getAttribute('href') || '',
                        }))
                            .filter(item => item.title && item.url);
                    }, [], 'navigation extraction');
                    for (const item of navItems) {
                        if (item.title && item.url) {
                            try {
                                const fullUrl = item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`;
                                const sanitizedUrl = sanitization_util_1.SanitizationUtil.sanitizeUrl(fullUrl);
                                const slug = this.generateSlug(item.title);
                                results.push({
                                    title: sanitization_util_1.SanitizationUtil.sanitizeHtml(item.title),
                                    slug,
                                    url: sanitizedUrl,
                                });
                            }
                            catch (error) {
                                this.logger.warn(`Failed to process navigation item: ${item.title} - ${error.message}`);
                            }
                        }
                    }
                    this.logger.log(`Extracted ${results.length} navigation items`);
                }
                catch (error) {
                    this.logger.error(`Navigation scraping failed: ${error.message}`);
                    throw new custom_exceptions_1.ScrapingException(`Failed to scrape navigation: ${error.message}`, error);
                }
            },
            failedRequestHandler: async ({ request, error }) => {
                this.logger.error(`Navigation request failed: ${request.url} - ${error.message}`);
            },
        });
        try {
            await crawler.run([this.baseUrl]);
            return results;
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Navigation scraping failed: ${error.message}`, error);
        }
        finally {
            await crawler.teardown();
        }
    }
    async scrapeCategories(navigationUrl, maxDepth = 3) {
        this.logger.log(`Starting category scraping from: ${navigationUrl}`);
        const results = [];
        if (!(await this.checkRobotsTxt(navigationUrl))) {
            throw new custom_exceptions_1.ScrapingException('Category scraping not allowed by robots.txt');
        }
        const crawler = new crawlee_1.PlaywrightCrawler({
            ...this.createCrawlerConfig(),
            requestHandler: async ({ page, request, enqueueLinks }) => {
                await this.randomDelay();
                try {
                    this.logger.debug(`Scraping categories from: ${request.loadedUrl}`);
                    await page.setExtraHTTPHeaders({
                        'User-Agent': this.userAgent,
                    });
                    await page.waitForLoadState('networkidle', { timeout: this.timeout });
                    const categoryItems = await this.safePageEvaluation(page, () => {
                        const categoryLinks = Array.from(document.querySelectorAll('.category-list a, .categories a, .subcategory a, [class*="category"] a'));
                        return categoryLinks
                            .filter(link => {
                            const href = link.getAttribute('href');
                            return href && (href.includes('/category/') || href.includes('/categories/'));
                        })
                            .map(link => {
                            const title = link.textContent?.trim() || '';
                            const url = link.getAttribute('href') || '';
                            const productCountText = link.querySelector('.count, .product-count')?.textContent;
                            const productCount = productCountText ? parseInt(productCountText.replace(/\D/g, '')) : 0;
                            return {
                                title,
                                url,
                                productCount: isNaN(productCount) ? 0 : productCount,
                            };
                        })
                            .filter(item => item.title && item.url);
                    }, [], 'category extraction');
                    for (const item of categoryItems) {
                        try {
                            const fullUrl = item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`;
                            const sanitizedUrl = sanitization_util_1.SanitizationUtil.sanitizeUrl(fullUrl);
                            const slug = this.generateSlug(item.title);
                            results.push({
                                title: sanitization_util_1.SanitizationUtil.sanitizeHtml(item.title),
                                slug,
                                url: sanitizedUrl,
                                productCount: item.productCount,
                            });
                        }
                        catch (error) {
                            this.logger.warn(`Failed to process category item: ${item.title} - ${error.message}`);
                        }
                    }
                    const currentDepth = request.userData?.depth || 0;
                    if (currentDepth < maxDepth) {
                        await enqueueLinks({
                            selector: '.category-list a, .categories a, .subcategory a',
                            userData: { depth: currentDepth + 1 },
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Category scraping failed for ${request.url}: ${error.message}`);
                }
            },
            failedRequestHandler: async ({ request, error }) => {
                this.logger.error(`Category request failed: ${request.url} - ${error.message}`);
            },
        });
        try {
            await crawler.run([{ url: navigationUrl, userData: { depth: 0 } }]);
            this.logger.log(`Extracted ${results.length} category items`);
            return results;
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Category scraping failed: ${error.message}`, error);
        }
        finally {
            await crawler.teardown();
        }
    }
    async scrapeProducts(categoryUrl, maxPages = 10) {
        this.logger.log(`Starting product scraping from: ${categoryUrl}`);
        const results = [];
        if (!(await this.checkRobotsTxt(categoryUrl))) {
            throw new custom_exceptions_1.ScrapingException('Product scraping not allowed by robots.txt');
        }
        const crawler = new crawlee_1.PlaywrightCrawler({
            ...this.createCrawlerConfig(),
            requestHandler: async ({ page, request, enqueueLinks }) => {
                await this.randomDelay();
                try {
                    this.logger.debug(`Scraping products from: ${request.loadedUrl}`);
                    await page.setExtraHTTPHeaders({
                        'User-Agent': this.userAgent,
                    });
                    await page.waitForLoadState('networkidle', { timeout: this.timeout });
                    const productItems = await this.safePageEvaluation(page, () => {
                        const productElements = Array.from(document.querySelectorAll('.product-item, .product-card, .book-item, [class*="product"]'));
                        return productElements.map(element => {
                            const titleElement = element.querySelector('h2, h3, .title, .product-title, .book-title');
                            const title = titleElement?.textContent?.trim() || '';
                            const linkElement = element.querySelector('a');
                            const url = linkElement?.getAttribute('href') || '';
                            const authorElement = element.querySelector('.author, .by-author, [class*="author"]');
                            const author = authorElement?.textContent?.trim() || '';
                            const priceElement = element.querySelector('.price, .cost, [class*="price"]');
                            const priceText = priceElement?.textContent?.trim() || '';
                            const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
                            const imageElement = element.querySelector('img');
                            const imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';
                            const stockElement = element.querySelector('.stock, .availability, [class*="stock"]');
                            const inStock = !stockElement?.textContent?.toLowerCase().includes('out of stock');
                            const sourceId = url ? url.split('/').pop()?.replace(/[^\w-]/g, '') :
                                title.toLowerCase().replace(/[^\w]/g, '-').substring(0, 50);
                            return {
                                sourceId: sourceId || '',
                                title,
                                author,
                                price,
                                currency: 'GBP',
                                imageUrl,
                                sourceUrl: url,
                                inStock,
                            };
                        }).filter(item => item.title && item.sourceId);
                    }, [], 'product extraction');
                    for (const item of productItems) {
                        try {
                            const fullUrl = item.sourceUrl.startsWith('http') ? item.sourceUrl : `${this.baseUrl}${item.sourceUrl}`;
                            const sanitizedUrl = sanitization_util_1.SanitizationUtil.sanitizeUrl(fullUrl);
                            const sanitizedImageUrl = item.imageUrl ?
                                (item.imageUrl.startsWith('http') ? item.imageUrl : `${this.baseUrl}${item.imageUrl}`) : '';
                            results.push({
                                sourceId: sanitization_util_1.SanitizationUtil.removeControlCharacters(item.sourceId),
                                title: sanitization_util_1.SanitizationUtil.sanitizeHtml(item.title),
                                author: item.author ? sanitization_util_1.SanitizationUtil.sanitizeHtml(item.author) : undefined,
                                price: sanitization_util_1.SanitizationUtil.sanitizePrice(item.price),
                                currency: item.currency,
                                imageUrl: sanitizedImageUrl ? sanitization_util_1.SanitizationUtil.sanitizeUrl(sanitizedImageUrl) : undefined,
                                sourceUrl: sanitizedUrl,
                                inStock: item.inStock,
                            });
                        }
                        catch (error) {
                            this.logger.warn(`Failed to process product item: ${item.title} - ${error.message}`);
                        }
                    }
                    const currentPage = request.userData?.page || 1;
                    if (currentPage < maxPages) {
                        await enqueueLinks({
                            selector: '.pagination a, .next-page, [class*="next"]',
                            userData: { page: currentPage + 1 },
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Product scraping failed for ${request.url}: ${error.message}`);
                }
            },
            failedRequestHandler: async ({ request, error }) => {
                this.logger.error(`Product request failed: ${request.url} - ${error.message}`);
            },
        });
        try {
            await crawler.run([{ url: categoryUrl, userData: { page: 1 } }]);
            this.logger.log(`Extracted ${results.length} product items`);
            return results;
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Product scraping failed: ${error.message}`, error);
        }
        finally {
            await crawler.teardown();
        }
    }
    async scrapeProductDetail(productUrl) {
        this.logger.log(`Starting product detail scraping from: ${productUrl}`);
        if (!(await this.checkRobotsTxt(productUrl))) {
            throw new custom_exceptions_1.ScrapingException('Product detail scraping not allowed by robots.txt');
        }
        let result = null;
        const crawler = new crawlee_1.PlaywrightCrawler({
            ...this.createCrawlerConfig(),
            requestHandler: async ({ page }) => {
                await this.randomDelay();
                try {
                    this.logger.debug(`Scraping product detail from: ${productUrl}`);
                    await page.setExtraHTTPHeaders({
                        'User-Agent': this.userAgent,
                    });
                    await page.waitForLoadState('networkidle', { timeout: this.timeout });
                    const productDetail = await this.safePageEvaluation(page, () => {
                        const titleElement = document.querySelector('h1, .product-title, .book-title');
                        const title = titleElement?.textContent?.trim() || '';
                        const authorElement = document.querySelector('.author, .by-author, [class*="author"]');
                        const author = authorElement?.textContent?.trim() || '';
                        const priceElement = document.querySelector('.price, .cost, [class*="price"]');
                        const priceText = priceElement?.textContent?.trim() || '';
                        const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
                        const imageElement = document.querySelector('.product-image img, .book-image img, img[class*="product"]');
                        const imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';
                        const stockElement = document.querySelector('.stock, .availability, [class*="stock"]');
                        const inStock = !stockElement?.textContent?.toLowerCase().includes('out of stock');
                        const descriptionElement = document.querySelector('.description, .product-description, .book-description');
                        const description = descriptionElement?.textContent?.trim() || '';
                        const publisherElement = document.querySelector('.publisher, [class*="publisher"]');
                        const publisher = publisherElement?.textContent?.trim() || '';
                        const isbnElement = document.querySelector('.isbn, [class*="isbn"]');
                        const isbn = isbnElement?.textContent?.trim() || '';
                        const pageCountElement = document.querySelector('.pages, .page-count, [class*="pages"]');
                        const pageCountText = pageCountElement?.textContent?.trim() || '';
                        const pageCount = parseInt(pageCountText.replace(/\D/g, '')) || 0;
                        const genreElements = Array.from(document.querySelectorAll('.genre, .category, .tag, [class*="genre"]'));
                        const genres = genreElements.map(el => el.textContent?.trim()).filter(Boolean);
                        const reviewElements = Array.from(document.querySelectorAll('.review, .customer-review, [class*="review"]'));
                        const reviews = reviewElements.map(element => {
                            const authorEl = element.querySelector('.reviewer, .review-author, [class*="author"]');
                            const ratingEl = element.querySelector('.rating, .stars, [class*="rating"]');
                            const textEl = element.querySelector('.review-text, .comment, [class*="text"]');
                            const dateEl = element.querySelector('.date, .review-date, [class*="date"]');
                            const ratingText = ratingEl?.textContent || ratingEl?.getAttribute('data-rating') || '';
                            const rating = parseFloat(ratingText.replace(/[^\d.]/g, '')) || 0;
                            return {
                                author: authorEl?.textContent?.trim() || '',
                                rating: rating > 0 ? rating : undefined,
                                text: textEl?.textContent?.trim() || '',
                                reviewDate: dateEl?.textContent?.trim() || '',
                                helpfulCount: 0,
                            };
                        }).filter(review => review.text);
                        const sourceId = window.location.pathname.split('/').pop()?.replace(/[^\w-]/g, '') ||
                            title.toLowerCase().replace(/[^\w]/g, '-').substring(0, 50);
                        return {
                            sourceId: sourceId || '',
                            title,
                            author,
                            price,
                            currency: 'GBP',
                            imageUrl,
                            sourceUrl: window.location.href,
                            inStock,
                            description,
                            publisher,
                            isbn,
                            pageCount: pageCount > 0 ? pageCount : undefined,
                            genres: genres.length > 0 ? genres : undefined,
                            reviews: reviews.length > 0 ? reviews : undefined,
                        };
                    }, null, 'product detail extraction');
                    if (productDetail) {
                        try {
                            const sanitizedImageUrl = productDetail.imageUrl ?
                                (productDetail.imageUrl.startsWith('http') ? productDetail.imageUrl : `${this.baseUrl}${productDetail.imageUrl}`) : '';
                            result = {
                                sourceId: sanitization_util_1.SanitizationUtil.removeControlCharacters(productDetail.sourceId),
                                title: sanitization_util_1.SanitizationUtil.sanitizeHtml(productDetail.title),
                                author: productDetail.author ? sanitization_util_1.SanitizationUtil.sanitizeHtml(productDetail.author) : undefined,
                                price: sanitization_util_1.SanitizationUtil.sanitizePrice(productDetail.price),
                                currency: productDetail.currency,
                                imageUrl: sanitizedImageUrl ? sanitization_util_1.SanitizationUtil.sanitizeUrl(sanitizedImageUrl) : undefined,
                                sourceUrl: sanitization_util_1.SanitizationUtil.sanitizeUrl(productDetail.sourceUrl),
                                inStock: productDetail.inStock,
                                description: productDetail.description ? sanitization_util_1.SanitizationUtil.sanitizeHtml(productDetail.description) : undefined,
                                publisher: productDetail.publisher ? sanitization_util_1.SanitizationUtil.sanitizeHtml(productDetail.publisher) : undefined,
                                isbn: productDetail.isbn ? sanitization_util_1.SanitizationUtil.removeControlCharacters(productDetail.isbn) : undefined,
                                pageCount: productDetail.pageCount,
                                genres: productDetail.genres?.map(genre => sanitization_util_1.SanitizationUtil.sanitizeHtml(genre)),
                                reviews: productDetail.reviews?.map(review => ({
                                    author: review.author ? sanitization_util_1.SanitizationUtil.sanitizeHtml(review.author) : undefined,
                                    rating: review.rating,
                                    text: review.text ? sanitization_util_1.SanitizationUtil.sanitizeHtml(review.text) : undefined,
                                    reviewDate: review.reviewDate ? sanitization_util_1.SanitizationUtil.removeControlCharacters(review.reviewDate) : undefined,
                                    helpfulCount: review.helpfulCount,
                                })),
                            };
                        }
                        catch (error) {
                            this.logger.warn(`Failed to process product detail: ${error.message}`);
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Product detail scraping failed for ${productUrl}: ${error.message}`);
                    throw new custom_exceptions_1.ScrapingException(`Failed to scrape product detail: ${error.message}`, error);
                }
            },
            failedRequestHandler: async ({ request, error }) => {
                this.logger.error(`Product detail request failed: ${request.url} - ${error.message}`);
            },
        });
        try {
            await crawler.run([productUrl]);
            if (!result) {
                throw new custom_exceptions_1.ScrapingException('No product detail data extracted');
            }
            this.logger.log(`Successfully extracted product detail for: ${result.title}`);
            return result;
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Product detail scraping failed: ${error.message}`, error);
        }
        finally {
            await crawler.teardown();
        }
    }
    async batchUpdateMissingImages(products) {
        this.logger.log(`Starting batch image update for ${products.length} products`);
        const updatedProducts = [];
        for (const product of products) {
            try {
                if (!product.imageUrl || product.imageUrl === '') {
                    this.logger.log(`Updating image for product: ${product.title}`);
                    const imageUrl = await this.scrapeOrGenerateImageUrl(product);
                    if (imageUrl) {
                        const updatedProduct = { ...product, imageUrl };
                        updatedProducts.push(updatedProduct);
                        this.logger.log(`✅ Updated image for ${product.title}: ${imageUrl}`);
                    }
                    else {
                        updatedProducts.push(product);
                        this.logger.warn(`⚠️ Could not find image for ${product.title}`);
                    }
                }
                else {
                    updatedProducts.push(product);
                }
                await this.randomDelay();
            }
            catch (error) {
                this.logger.error(`Error updating image for ${product.title}: ${error.message}`);
                updatedProducts.push(product);
            }
        }
        this.logger.log(`Completed batch image update. Updated ${updatedProducts.filter(p => p.imageUrl).length}/${products.length} products`);
        return updatedProducts;
    }
};
exports.WorldOfBooksScraperService = WorldOfBooksScraperService;
exports.WorldOfBooksScraperService = WorldOfBooksScraperService = WorldOfBooksScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WorldOfBooksScraperService);
//# sourceMappingURL=world-of-books-scraper.service.js.map