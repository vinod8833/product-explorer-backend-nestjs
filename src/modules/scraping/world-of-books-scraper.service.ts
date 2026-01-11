import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { Page } from 'playwright';
import { ScrapingException } from '../../common/exceptions/custom-exceptions';
import { SanitizationUtil } from '../../common/utils/sanitization.util';

export interface NavigationItem {
  title: string;
  slug: string;
  url: string;
}

export interface CategoryItem {
  title: string;
  slug: string;
  url: string;
  parentSlug?: string;
  productCount?: number;
}

export interface ProductItem {
  sourceId: string;
  title: string;
  author?: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  sourceUrl: string;
  inStock: boolean;
}

export interface ProductDetailItem extends ProductItem {
  description?: string;
  specs?: Record<string, any>;
  publisher?: string;
  publicationDate?: string;
  isbn?: string;
  pageCount?: number;
  genres?: string[];
  reviews?: ReviewItem[];
}

export interface ReviewItem {
  author?: string;
  rating?: number;
  text?: string;
  reviewDate?: string;
  helpfulCount?: number;
}

@Injectable()
export class WorldOfBooksScraperService {
  private readonly logger = new Logger(WorldOfBooksScraperService.name);
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly delayMin: number;
  private readonly delayMax: number;
  private readonly maxRetries: number;
  private readonly timeout: number;
  private readonly respectRobotsTxt: boolean;
  private readonly proxyUrls: string[];

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('WOB_BASE_URL', 'https://www.worldofbooks.com');
    this.userAgent = this.configService.get(
      'WOB_USER_AGENT',
      'Mozilla/5.0 (compatible; ProductExplorer/1.0)',
    );
    this.delayMin = this.configService.get('SCRAPING_DELAY_MIN', 1000);
    this.delayMax = this.configService.get('SCRAPING_DELAY_MAX', 3000);
    this.maxRetries = this.configService.get('SCRAPING_MAX_RETRIES', 3);
    this.timeout = this.configService.get('SCRAPING_TIMEOUT', 30000);
    this.respectRobotsTxt = this.configService.get('SCRAPING_RESPECT_ROBOTS', true);
    this.proxyUrls = this.configService.get('SCRAPING_PROXY_URLS', '').split(',').filter(Boolean);
  }

  private async checkRobotsTxt(url: string): Promise<boolean> {
    if (!this.respectRobotsTxt) return true;

    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const response = await fetch(robotsUrl);
      
      if (!response.ok) return true; 
      
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
    } catch (error) {
      this.logger.warn(`Failed to check robots.txt for ${url}: ${error.message}`);
      return true; 
    }
  }

  private createCrawlerConfig() {
    const config: any = {
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
      config.proxyConfiguration = new ProxyConfiguration({
        proxyUrls: this.proxyUrls,
      });
    }

    return config;
  }

  private async randomDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * (this.delayMax - this.delayMin + 1)) + this.delayMin;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async safePageEvaluation<T>(
    page: Page,
    evaluation: () => T | Promise<T>,
    fallback: T,
    context: string,
  ): Promise<T> {
    try {
      return await page.evaluate(evaluation);
    } catch (error) {
      this.logger.warn(`Page evaluation failed in ${context}: ${error.message}`);
      return fallback;
    }
  }

  private generateSlug(title: string): string {
    return SanitizationUtil.generateSlug(title);
  }

  async scrapeNavigation(): Promise<NavigationItem[]> {
    this.logger.log('Starting navigation scraping');
    const results: NavigationItem[] = [];

    if (!(await this.checkRobotsTxt(this.baseUrl))) {
      throw new ScrapingException('Scraping not allowed by robots.txt');
    }

    const crawler = new PlaywrightCrawler({
      ...this.createCrawlerConfig(),
      requestHandler: async ({ page }) => {
        await this.randomDelay();
        
        try {
          this.logger.debug(`Scraping navigation from: ${this.baseUrl}`);
          
          await page.setExtraHTTPHeaders({
            'User-Agent': this.userAgent,
          });

          await page.waitForLoadState('networkidle', { timeout: this.timeout });
          
          const navItems = await this.safePageEvaluation(
            page,
            () => {
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
            },
            [],
            'navigation extraction'
          );

          for (const item of navItems) {
            if (item.title && item.url) {
              try {
                const fullUrl = item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`;
                const sanitizedUrl = SanitizationUtil.sanitizeUrl(fullUrl);
                const slug = this.generateSlug(item.title);
                
                results.push({
                  title: SanitizationUtil.sanitizeHtml(item.title),
                  slug,
                  url: sanitizedUrl,
                });
              } catch (error) {
                this.logger.warn(`Failed to process navigation item: ${item.title} - ${error.message}`);
              }
            }
          }

          this.logger.log(`Extracted ${results.length} navigation items`);
        } catch (error) {
          this.logger.error(`Navigation scraping failed: ${error.message}`);
          throw new ScrapingException(`Failed to scrape navigation: ${error.message}`, error);
        }
      },
      failedRequestHandler: async ({ request, error }) => {
        this.logger.error(`Navigation request failed: ${request.url} - ${(error as Error).message}`);
      },
    });

    try {
      await crawler.run([this.baseUrl]);
      return results;
    } catch (error) {
      throw new ScrapingException(`Navigation scraping failed: ${error.message}`, error);
    } finally {
      await crawler.teardown();
    }
  }

  async scrapeCategories(navigationUrl: string, maxDepth: number = 3): Promise<CategoryItem[]> {
    this.logger.log(`Starting category scraping from: ${navigationUrl}`);
    const results: CategoryItem[] = [];

    if (!(await this.checkRobotsTxt(navigationUrl))) {
      throw new ScrapingException('Category scraping not allowed by robots.txt');
    }

    const crawler = new PlaywrightCrawler({
      ...this.createCrawlerConfig(),
      requestHandler: async ({ page, request, enqueueLinks }) => {
        await this.randomDelay();
        
        try {
          this.logger.debug(`Scraping categories from: ${request.loadedUrl}`);
          
          await page.setExtraHTTPHeaders({
            'User-Agent': this.userAgent,
          });

          await page.waitForLoadState('networkidle', { timeout: this.timeout });
          
          const categoryItems = await this.safePageEvaluation(
            page,
            () => {
              const categoryLinks = Array.from(document.querySelectorAll(
                '.category-list a, .categories a, .subcategory a, [class*="category"] a'
              ));
              
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
            },
            [],
            'category extraction'
          );

          for (const item of categoryItems) {
            try {
              const fullUrl = item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`;
              const sanitizedUrl = SanitizationUtil.sanitizeUrl(fullUrl);
              const slug = this.generateSlug(item.title);
              
              results.push({
                title: SanitizationUtil.sanitizeHtml(item.title),
                slug,
                url: sanitizedUrl,
                productCount: item.productCount,
              });
            } catch (error) {
              this.logger.warn(`Failed to process category item: ${item.title} - ${error.message}`);
            }
          }

          const currentDepth = (request.userData?.depth as number) || 0;
          if (currentDepth < maxDepth) {
            await enqueueLinks({
              selector: '.category-list a, .categories a, .subcategory a',
              userData: { depth: currentDepth + 1 },
            });
          }

        } catch (error) {
          this.logger.error(`Category scraping failed for ${request.url}: ${error.message}`);
        }
      },
      failedRequestHandler: async ({ request, error }) => {
        this.logger.error(`Category request failed: ${request.url} - ${(error as Error).message}`);
      },
    });

    try {
      await crawler.run([{ url: navigationUrl, userData: { depth: 0 } }]);
      this.logger.log(`Extracted ${results.length} category items`);
      return results;
    } catch (error) {
      throw new ScrapingException(`Category scraping failed: ${error.message}`, error);
    } finally {
      await crawler.teardown();
    }
  }

  async scrapeProducts(categoryUrl: string, maxPages: number = 10): Promise<ProductItem[]> {
    this.logger.log(`Starting product scraping from: ${categoryUrl}`);
    const results: ProductItem[] = [];

    if (!(await this.checkRobotsTxt(categoryUrl))) {
      throw new ScrapingException('Product scraping not allowed by robots.txt');
    }

    const crawler = new PlaywrightCrawler({
      ...this.createCrawlerConfig(),
      requestHandler: async ({ page, request, enqueueLinks }) => {
        await this.randomDelay();
        
        try {
          this.logger.debug(`Scraping products from: ${request.loadedUrl}`);
          
          await page.setExtraHTTPHeaders({
            'User-Agent': this.userAgent,
          });

          await page.waitForLoadState('networkidle', { timeout: this.timeout });
          
          const productItems = await this.safePageEvaluation(
            page,
            () => {
              const productElements = Array.from(document.querySelectorAll(
                '.product-item, .product-card, .book-item, [class*="product"]'
              ));
              
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
            },
            [],
            'product extraction'
          );

          for (const item of productItems) {
            try {
              const fullUrl = item.sourceUrl.startsWith('http') ? item.sourceUrl : `${this.baseUrl}${item.sourceUrl}`;
              const sanitizedUrl = SanitizationUtil.sanitizeUrl(fullUrl);
              const sanitizedImageUrl = item.imageUrl ? 
                (item.imageUrl.startsWith('http') ? item.imageUrl : `${this.baseUrl}${item.imageUrl}`) : '';
              
              results.push({
                sourceId: SanitizationUtil.removeControlCharacters(item.sourceId),
                title: SanitizationUtil.sanitizeHtml(item.title),
                author: item.author ? SanitizationUtil.sanitizeHtml(item.author) : undefined,
                price: SanitizationUtil.sanitizePrice(item.price),
                currency: item.currency,
                imageUrl: sanitizedImageUrl ? SanitizationUtil.sanitizeUrl(sanitizedImageUrl) : undefined,
                sourceUrl: sanitizedUrl,
                inStock: item.inStock,
              });
            } catch (error) {
              this.logger.warn(`Failed to process product item: ${item.title} - ${error.message}`);
            }
          }

          const currentPage = (request.userData?.page as number) || 1;
          if (currentPage < maxPages) {
            await enqueueLinks({
              selector: '.pagination a, .next-page, [class*="next"]',
              userData: { page: currentPage + 1 },
            });
          }

        } catch (error) {
          this.logger.error(`Product scraping failed for ${request.url}: ${error.message}`);
        }
      },
      failedRequestHandler: async ({ request, error }) => {
        this.logger.error(`Product request failed: ${request.url} - ${(error as Error).message}`);
      },
    });

    try {
      await crawler.run([{ url: categoryUrl, userData: { page: 1 } }]);
      this.logger.log(`Extracted ${results.length} product items`);
      return results;
    } catch (error) {
      throw new ScrapingException(`Product scraping failed: ${error.message}`, error);
    } finally {
      await crawler.teardown();
    }
  }

  async scrapeProductDetail(productUrl: string): Promise<ProductDetailItem> {
    this.logger.log(`Starting product detail scraping from: ${productUrl}`);

    if (!(await this.checkRobotsTxt(productUrl))) {
      throw new ScrapingException('Product detail scraping not allowed by robots.txt');
    }

    let result: ProductDetailItem | null = null;

    const crawler = new PlaywrightCrawler({
      ...this.createCrawlerConfig(),
      requestHandler: async ({ page }) => {
        await this.randomDelay();
        
        try {
          this.logger.debug(`Scraping product detail from: ${productUrl}`);
          
          await page.setExtraHTTPHeaders({
            'User-Agent': this.userAgent,
          });

          await page.waitForLoadState('networkidle', { timeout: this.timeout });
          
          const productDetail = await this.safePageEvaluation(
            page,
            () => {
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
            },
            null,
            'product detail extraction'
          );

          if (productDetail) {
            try {
              const sanitizedImageUrl = productDetail.imageUrl ? 
                (productDetail.imageUrl.startsWith('http') ? productDetail.imageUrl : `${this.baseUrl}${productDetail.imageUrl}`) : '';
              
              result = {
                sourceId: SanitizationUtil.removeControlCharacters(productDetail.sourceId),
                title: SanitizationUtil.sanitizeHtml(productDetail.title),
                author: productDetail.author ? SanitizationUtil.sanitizeHtml(productDetail.author) : undefined,
                price: SanitizationUtil.sanitizePrice(productDetail.price),
                currency: productDetail.currency,
                imageUrl: sanitizedImageUrl ? SanitizationUtil.sanitizeUrl(sanitizedImageUrl) : undefined,
                sourceUrl: SanitizationUtil.sanitizeUrl(productDetail.sourceUrl),
                inStock: productDetail.inStock,
                description: productDetail.description ? SanitizationUtil.sanitizeHtml(productDetail.description) : undefined,
                publisher: productDetail.publisher ? SanitizationUtil.sanitizeHtml(productDetail.publisher) : undefined,
                isbn: productDetail.isbn ? SanitizationUtil.removeControlCharacters(productDetail.isbn) : undefined,
                pageCount: productDetail.pageCount,
                genres: productDetail.genres?.map(genre => SanitizationUtil.sanitizeHtml(genre)),
                reviews: productDetail.reviews?.map(review => ({
                  author: review.author ? SanitizationUtil.sanitizeHtml(review.author) : undefined,
                  rating: review.rating,
                  text: review.text ? SanitizationUtil.sanitizeHtml(review.text) : undefined,
                  reviewDate: review.reviewDate ? SanitizationUtil.removeControlCharacters(review.reviewDate) : undefined,
                  helpfulCount: review.helpfulCount,
                })),
              };
            } catch (error) {
              this.logger.warn(`Failed to process product detail: ${error.message}`);
            }
          }

        } catch (error) {
          this.logger.error(`Product detail scraping failed for ${productUrl}: ${error.message}`);
          throw new ScrapingException(`Failed to scrape product detail: ${error.message}`, error);
        }
      },
      failedRequestHandler: async ({ request, error }) => {
        this.logger.error(`Product detail request failed: ${request.url} - ${(error as Error).message}`);
      },
    });

    try {
      await crawler.run([productUrl]);
      
      if (!result) {
        throw new ScrapingException('No product detail data extracted');
      }
      
      this.logger.log(`Successfully extracted product detail for: ${result.title}`);
      return result;
    } catch (error) {
      throw new ScrapingException(`Product detail scraping failed: ${error.message}`, error);
    } finally {
      await crawler.teardown();
    }
  }
}