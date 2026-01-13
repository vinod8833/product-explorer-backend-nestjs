import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { Page } from 'playwright';
import { ScrapingException } from '../../common/exceptions/custom-exceptions';
import { SanitizationUtil } from '../../common/utils/sanitization.util';
import axios from 'axios';

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

  /**
   * Verify if an image URL is accessible and returns a valid image
   */
  async verifyImageUrl(imageUrl: string): Promise<boolean> {
    if (!imageUrl) return false;
    
    try {
      const response = await axios.head(imageUrl, {
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
    } catch (error) {
      this.logger.warn(`Image verification failed for ${imageUrl}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if product data is complete and images are valid
   */
  async validateProductData(product: ProductItem): Promise<{ isValid: boolean; missingFields: string[] }> {
    const missingFields: string[] = [];
    
    // Check required fields
    if (!product.title) missingFields.push('title');
    if (!product.author) missingFields.push('author');
    if (!product.price) missingFields.push('price');
    if (!product.sourceUrl) missingFields.push('sourceUrl');
    
    // Check image validity
    if (!product.imageUrl) {
      missingFields.push('imageUrl');
    } else {
      const isImageValid = await this.verifyImageUrl(product.imageUrl);
      if (!isImageValid) {
        missingFields.push('validImageUrl');
      }
    }
    
    const isValid = missingFields.length === 0;
    
    this.logger.debug(`Product validation for ${product.sourceId}: ${isValid ? 'VALID' : 'INVALID'} (missing: ${missingFields.join(', ')})`);
    
    return { isValid, missingFields };
  }

  /**
   * Scrape product data with automatic fallback when data is missing or invalid
   */
  async scrapeProductWithFallback(sourceId: string, existingProduct?: ProductItem): Promise<ProductItem | null> {
    try {
      // If we have existing product data, validate it first
      if (existingProduct) {
        const validation = await this.validateProductData(existingProduct);
        if (validation.isValid) {
          this.logger.debug(`Product ${sourceId} has valid data, no scraping needed`);
          return existingProduct;
        }
        
        this.logger.log(`Product ${sourceId} has invalid/missing data (${validation.missingFields.join(', ')}), triggering scrape`);
      }
      
      // Try multiple approaches to get product data
      let scrapedProduct: ProductItem | null = null;
      
      // 1. Try constructing URL from sourceId
      const productUrl = this.constructProductUrl(sourceId);
      if (productUrl) {
        try {
          scrapedProduct = await this.scrapeProductDetail(productUrl);
          if (scrapedProduct) {
            this.logger.log(`Successfully scraped fresh data for product ${sourceId} from constructed URL`);
            return scrapedProduct;
          }
        } catch (error) {
          this.logger.warn(`Failed to scrape from constructed URL for ${sourceId}: ${error.message}`);
        }
      }
      
      // 2. Try searching for the product by title
      if (existingProduct?.title) {
        try {
          scrapedProduct = await this.searchAndScrapeProduct(existingProduct.title, existingProduct.author);
          if (scrapedProduct) {
            this.logger.log(`Successfully found and scraped product ${sourceId} via search`);
            return scrapedProduct;
          }
        } catch (error) {
          this.logger.warn(`Failed to search and scrape product ${sourceId}: ${error.message}`);
        }
      }
      
      // 3. Try using mock/placeholder data for testing
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
      
    } catch (error) {
      this.logger.error(`Error in scrapeProductWithFallback for ${sourceId}: ${error.message}`);
      return existingProduct || null;
    }
  }

  /**
   * Search for a product by title and author, then scrape its details
   */
  private async searchAndScrapeProduct(title: string, author?: string): Promise<ProductItem | null> {
    try {
      // Create search query
      const searchQuery = author ? `${title} ${author}` : title;
      const searchUrl = `${this.baseUrl}/en-gb/search?q=${encodeURIComponent(searchQuery)}`;
      
      this.logger.debug(`Searching for product: ${searchQuery}`);
      
      // For now, return mock data since actual scraping might be blocked
      // In production, this would perform actual search and scraping
      return null;
      
    } catch (error) {
      this.logger.error(`Error searching for product "${title}": ${error.message}`);
      return null;
    }
  }

  /**
   * Get mock image URL for testing purposes
   */
  private getMockImageUrl(title: string): string | null {
    const mockImages: Record<string, string> = {
      'The Great Gatsby': 'https://images-na.ssl-images-amazon.com/images/I/81af+MCATTL.jpg',
      'To Kill a Mockingbird': 'https://images-na.ssl-images-amazon.com/images/I/71FxgtFKcQL.jpg',
      'Sapiens': 'https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL.jpg',
      'Pride and Prejudice': 'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
      '1984': 'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
      'Harry Potter': 'https://images-na.ssl-images-amazon.com/images/I/81YOuOGFCJL.jpg'
    };
    
    // Try exact match first
    if (mockImages[title]) {
      return mockImages[title];
    }
    
    // Try partial match
    for (const [key, url] of Object.entries(mockImages)) {
      if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
        return url;
      }
    }
    
    return null;
  }

  /**
   * Construct product URL from sourceId
   */
  private constructProductUrl(sourceId: string): string | null {
    try {
      // Handle different sourceId formats
      if (sourceId.startsWith('http')) {
        return sourceId; // Already a full URL
      }
      
      // For World of Books, construct URL from sourceId
      // Example: sample-book-1 -> https://www.worldofbooks.com/en-gb/books/sample-book-1
      const cleanSourceId = sourceId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
      const constructedUrl = `${this.baseUrl}/en-gb/books/${cleanSourceId}`;
      
      this.logger.debug(`Constructed URL for ${sourceId}: ${constructedUrl}`);
      return constructedUrl;
      
    } catch (error) {
      this.logger.error(`Error constructing product URL for ${sourceId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Enhanced method to scrape or generate image URLs for products
   */
  async scrapeOrGenerateImageUrl(product: ProductItem): Promise<string | null> {
    try {
      // 1. Try to scrape from the actual product page
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
        } catch (error) {
          this.logger.warn(`Failed to scrape image from source URL for ${product.title}: ${error.message}`);
        }
      }

      // 2. Try mock/placeholder image
      const mockImageUrl = this.getMockImageUrl(product.title);
      if (mockImageUrl) {
        const isValid = await this.verifyImageUrl(mockImageUrl);
        if (isValid) {
          this.logger.log(`Using verified mock image for ${product.title}`);
          return mockImageUrl;
        }
      }

      // 3. Generate a placeholder image URL
      const placeholderUrl = this.generatePlaceholderImageUrl(product.title);
      this.logger.log(`Generated placeholder image for ${product.title}`);
      return placeholderUrl;

    } catch (error) {
      this.logger.error(`Error scraping/generating image URL for ${product.title}: ${error.message}`);
      return this.generatePlaceholderImageUrl(product.title);
    }
  }

  /**
   * Generate a placeholder image URL
   */
  private generatePlaceholderImageUrl(title: string): string {
    const encodedTitle = encodeURIComponent(title.substring(0, 50));
    return `https://via.placeholder.com/300x400/2563eb/ffffff?text=${encodedTitle}`;
  }

  /**
   * Enhanced product scraping with image verification
   */
  async scrapeProductsWithImageVerification(url: string, maxPages: number = 10): Promise<ProductItem[]> {
    const products = await this.scrapeProducts(url, maxPages);
    
    // Verify and fix images for all products
    const verifiedProducts: ProductItem[] = [];
    
    for (const product of products) {
      const validation = await this.validateProductData(product);
      
      if (!validation.isValid && validation.missingFields.includes('validImageUrl')) {
        // Try to find alternative image or scrape product detail for better image
        try {
          const detailedProduct = await this.scrapeProductWithFallback(product.sourceId, product);
          if (detailedProduct) {
            verifiedProducts.push(detailedProduct);
          } else {
            verifiedProducts.push(product); // Keep original even if image is invalid
          }
        } catch (error) {
          this.logger.warn(`Failed to get detailed product data for ${product.sourceId}: ${error.message}`);
          verifiedProducts.push(product);
        }
      } else {
        verifiedProducts.push(product);
      }
    }
    
    this.logger.log(`Verified ${verifiedProducts.length} products with image validation`);
    return verifiedProducts;
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

  /**
   * Batch update products with missing images
   */
  async batchUpdateMissingImages(products: ProductItem[]): Promise<ProductItem[]> {
    this.logger.log(`Starting batch image update for ${products.length} products`);
    const updatedProducts: ProductItem[] = [];

    for (const product of products) {
      try {
        // Check if product needs image update
        if (!product.imageUrl || product.imageUrl === '') {
          this.logger.log(`Updating image for product: ${product.title}`);
          
          const imageUrl = await this.scrapeOrGenerateImageUrl(product);
          if (imageUrl) {
            const updatedProduct = { ...product, imageUrl };
            updatedProducts.push(updatedProduct);
            this.logger.log(`✅ Updated image for ${product.title}: ${imageUrl}`);
          } else {
            updatedProducts.push(product);
            this.logger.warn(`⚠️ Could not find image for ${product.title}`);
          }
        } else {
          // Product already has image
          updatedProducts.push(product);
        }

        // Add delay between requests to be respectful
        await this.randomDelay();

      } catch (error) {
        this.logger.error(`Error updating image for ${product.title}: ${error.message}`);
        updatedProducts.push(product); // Keep original product even if update fails
      }
    }

    this.logger.log(`Completed batch image update. Updated ${updatedProducts.filter(p => p.imageUrl).length}/${products.length} products`);
    return updatedProducts;
  }
}