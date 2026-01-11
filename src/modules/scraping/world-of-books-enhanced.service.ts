import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { Page } from 'playwright';
import { ScrapingException } from '../../common/exceptions/custom-exceptions';
import { SanitizationUtil } from '../../common/utils/sanitization.util';
import { ProductItem, ProductDetailItem } from './world-of-books-scraper.service';

@Injectable()
export class WorldOfBooksEnhancedService {
  private readonly logger = new Logger(WorldOfBooksEnhancedService.name);
  private readonly baseUrl = 'https://www.worldofbooks.com';
  private readonly userAgent: string;
  private readonly delayMin: number;
  private readonly delayMax: number;

  constructor(private configService: ConfigService) {
    this.userAgent = this.configService.get(
      'WOB_USER_AGENT',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    );
    this.delayMin = this.configService.get('SCRAPING_DELAY_MIN', 2000);
    this.delayMax = this.configService.get('SCRAPING_DELAY_MAX', 5000);
  }

  private async randomDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * (this.delayMax - this.delayMin + 1)) + this.delayMin;
    this.logger.debug(`Waiting ${delay}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private createCrawlerConfig() {
    return {
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
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
          ],
        },
      },
      requestHandlerTimeoutSecs: 60,
      maxRequestRetries: 3,
      navigationTimeoutSecs: 30,
      maxConcurrency: 1,
      minConcurrency: 1,
    };
  }


  async scrapeCollectionBooks(collectionUrl: string, maxPages: number = 3): Promise<ProductItem[]> {
    this.logger.log(`Scraping books from collection: ${collectionUrl}`);
    const results: ProductItem[] = [];

    const crawler = new PlaywrightCrawler({
      ...this.createCrawlerConfig(),
      requestHandler: async ({ page, request, enqueueLinks }) => {
        await this.randomDelay();
        
        try {
          this.logger.debug(`Processing page: ${request.loadedUrl}`);
          
          await page.setExtraHTTPHeaders({
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          });

          await page.waitForLoadState('networkidle', { timeout: 30000 });
          
          try {
            await page.waitForSelector('.product-item, .product-card, [data-testid="product-item"]', { timeout: 10000 });
          } catch (error) {
            this.logger.warn('Product selector not found, continuing with page content');
          }

          const products = await page.evaluate(() => {
            const productSelectors = [
              '.product-item',
              '.product-card', 
              '[data-testid="product-item"]',
              '.book-item',
              '.grid-item',
              '.product',
              '[class*="product-"]'
            ];

            let productElements: Element[] = [];
            
            for (const selector of productSelectors) {
              productElements = Array.from(document.querySelectorAll(selector));
              if (productElements.length > 0) {
                console.log(`Found ${productElements.length} products with selector: ${selector}`);
                break;
              }
            }

            if (productElements.length === 0) {
              productElements = Array.from(document.querySelectorAll('[class*="product"], [class*="book"], [class*="item"]'))
                .filter(el => {
                  const text = el.textContent?.toLowerCase() || '';
                  return text.includes('£') || text.includes('$') || text.includes('price');
                });
            }

            return productElements.map((element, index) => {
              try {
                const titleSelectors = [
                  'h2', 'h3', 'h4',
                  '.title', '.product-title', '.book-title',
                  '[data-testid="product-title"]',
                  'a[href*="/products/"]',
                  '.name'
                ];
                
                let titleElement: Element | null = null;
                let title = '';
                
                for (const selector of titleSelectors) {
                  titleElement = element.querySelector(selector);
                  if (titleElement) {
                    title = titleElement.textContent?.trim() || '';
                    if (title) break;
                  }
                }

                if (!title) {
                  const linkElement = element.querySelector('a');
                  title = linkElement?.textContent?.trim() || '';
                }

                const authorSelectors = [
                  '.author', '.by-author', '[data-testid="author"]',
                  '.book-author', '.product-author',
                  '[class*="author"]'
                ];
                
                let author = '';
                for (const selector of authorSelectors) {
                  const authorElement = element.querySelector(selector);
                  if (authorElement) {
                    author = authorElement.textContent?.trim() || '';
                    if (author) break;
                  }
                }

                const priceSelectors = [
                  '.price', '.cost', '[data-testid="price"]',
                  '.product-price', '.book-price',
                  '[class*="price"]', '.amount'
                ];
                
                let priceText = '';
                for (const selector of priceSelectors) {
                  const priceElement = element.querySelector(selector);
                  if (priceElement) {
                    priceText = priceElement.textContent?.trim() || '';
                    if (priceText && (priceText.includes('£') || priceText.includes('$'))) break;
                  }
                }

                const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

                const imageSelectors = [
                  'img', '.product-image img', '.book-image img',
                  '[data-testid="product-image"]'
                ];
                
                let imageUrl = '';
                for (const selector of imageSelectors) {
                  const imageElement = element.querySelector(selector);
                  if (imageElement) {
                    imageUrl = imageElement.getAttribute('src') || 
                              imageElement.getAttribute('data-src') || 
                              imageElement.getAttribute('data-lazy-src') || '';
                    if (imageUrl) break;
                  }
                }

                const linkElement = element.querySelector('a[href*="/products/"], a[href*="/books/"], a');
                const productUrl = linkElement?.getAttribute('href') || '';

                const stockSelectors = [
                  '.stock', '.availability', '[data-testid="stock"]',
                  '.in-stock', '.out-of-stock'
                ];
                
                let stockText = '';
                for (const selector of stockSelectors) {
                  const stockElement = element.querySelector(selector);
                  if (stockElement) {
                    stockText = stockElement.textContent?.toLowerCase() || '';
                    break;
                  }
                }
                
                const inStock = !stockText.includes('out of stock') && !stockText.includes('unavailable');

                const sourceId = productUrl ? 
                  productUrl.split('/').pop()?.replace(/[^\w-]/g, '') || `product-${index}` :
                  title.toLowerCase().replace(/[^\w]/g, '-').substring(0, 50) || `product-${index}`;

                return {
                  sourceId,
                  title,
                  author,
                  price,
                  currency: priceText.includes('$') ? 'USD' : 'GBP',
                  imageUrl,
                  sourceUrl: productUrl,
                  inStock,
                  _debug: {
                    element: element.className,
                    titleFound: !!title,
                    priceFound: !!price,
                    urlFound: !!productUrl
                  }
                };
              } catch (error) {
                console.error('Error processing product element:', error);
                return null;
              }
            }).filter(product => product && product.title && product.sourceId);
          });

          this.logger.debug(`Extracted ${products.length} products from page`);

          for (const product of products) {
            try {
              const fullUrl = product.sourceUrl.startsWith('http') ? 
                product.sourceUrl : 
                `${this.baseUrl}${product.sourceUrl}`;
              
              const fullImageUrl = product.imageUrl && !product.imageUrl.startsWith('http') ? 
                `${this.baseUrl}${product.imageUrl}` : 
                product.imageUrl;

              results.push({
                sourceId: SanitizationUtil.removeControlCharacters(product.sourceId),
                title: SanitizationUtil.sanitizeHtml(product.title),
                author: product.author ? SanitizationUtil.sanitizeHtml(product.author) : undefined,
                price: SanitizationUtil.sanitizePrice(product.price),
                currency: product.currency,
                imageUrl: fullImageUrl ? SanitizationUtil.sanitizeUrl(fullImageUrl) : undefined,
                sourceUrl: SanitizationUtil.sanitizeUrl(fullUrl),
                inStock: product.inStock,
              });
            } catch (error) {
              this.logger.warn(`Failed to process product: ${product.title} - ${error.message}`);
            }
          }

          const currentPage = (request.userData?.page as number) || 1;
          if (currentPage < maxPages) {
            try {
              const nextPageSelectors = [
                'a[aria-label="Next"]',
                '.pagination .next',
                '.pagination a[rel="next"]',
                '.next-page',
                'a:contains("Next")',
                '.pagination a:last-child'
              ];

              let nextPageFound = false;
              for (const selector of nextPageSelectors) {
                try {
                  await page.waitForSelector(selector, { timeout: 2000 });
                  await enqueueLinks({
                    selector,
                    userData: { page: currentPage + 1 },
                  });
                  nextPageFound = true;
                  this.logger.debug(`Found next page link with selector: ${selector}`);
                  break;
                } catch (error) {
                }
              }

              if (!nextPageFound) {
                this.logger.debug('No next page link found');
              }
            } catch (error) {
              this.logger.warn(`Pagination handling failed: ${error.message}`);
            }
          }

        } catch (error) {
          this.logger.error(`Failed to process page ${request.url}: ${error.message}`);
          throw error;
        }
      },
      failedRequestHandler: async ({ request, error }) => {
        this.logger.error(`Request failed: ${request.url} - ${(error as Error).message}`);
      },
    });

    try {
      await crawler.run([{ url: collectionUrl, userData: { page: 1 } }]);
      this.logger.log(`Successfully scraped ${results.length} products from collection`);
      return results;
    } catch (error) {
      throw new ScrapingException(`Collection scraping failed: ${error.message}`, error);
    } finally {
      await crawler.teardown();
    }
  }


  async scrapeProductDetails(productUrl: string): Promise<ProductDetailItem | null> {
    this.logger.log(`Scraping product details from: ${productUrl}`);
    let result: ProductDetailItem | null = null;

    const crawler = new PlaywrightCrawler({
      ...this.createCrawlerConfig(),
      requestHandler: async ({ page }) => {
        await this.randomDelay();
        
        try {
          await page.setExtraHTTPHeaders({
            'User-Agent': this.userAgent,
          });

          await page.waitForLoadState('networkidle', { timeout: 30000 });

          const productDetail = await page.evaluate(() => {
            const titleSelectors = [
              'h1', '.product-title', '.book-title',
              '[data-testid="product-title"]', '.title'
            ];
            
            let title = '';
            for (const selector of titleSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                title = element.textContent?.trim() || '';
                if (title) break;
              }
            }

            const authorSelectors = [
              '.author', '.by-author', '[data-testid="author"]',
              '.book-author', '.product-author'
            ];
            
            let author = '';
            for (const selector of authorSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                author = element.textContent?.trim() || '';
                if (author) break;
              }
            }

            const priceSelectors = [
              '.price', '.cost', '[data-testid="price"]',
              '.product-price', '.book-price'
            ];
            
            let priceText = '';
            for (const selector of priceSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                priceText = element.textContent?.trim() || '';
                if (priceText && (priceText.includes('£') || priceText.includes('$'))) break;
              }
            }

            const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

            const descriptionSelectors = [
              '.description', '.product-description', '.book-description',
              '[data-testid="description"]', '.summary', '.overview'
            ];
            
            let description = '';
            for (const selector of descriptionSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                description = element.textContent?.trim() || '';
                if (description) break;
              }
            }

            const detailsSelectors = {
              publisher: ['.publisher', '[data-testid="publisher"]'],
              isbn: ['.isbn', '[data-testid="isbn"]', '.isbn-13', '.isbn-10'],
              pages: ['.pages', '.page-count', '[data-testid="pages"]'],
              publicationDate: ['.publication-date', '.published', '[data-testid="publication-date"]']
            };

            const details: any = {};
            for (const [key, selectors] of Object.entries(detailsSelectors)) {
              for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                  details[key] = element.textContent?.trim() || '';
                  if (details[key]) break;
                }
              }
            }

            const imageSelectors = [
              '.product-image img', '.book-image img',
              '[data-testid="product-image"]', '.main-image img'
            ];
            
            let imageUrl = '';
            for (const selector of imageSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                imageUrl = element.getAttribute('src') || 
                          element.getAttribute('data-src') || '';
                if (imageUrl) break;
              }
            }

            const sourceId = window.location.pathname.split('/').pop()?.replace(/[^\w-]/g, '') || 
                            title.toLowerCase().replace(/[^\w]/g, '-').substring(0, 50);

            return {
              sourceId: sourceId || '',
              title,
              author,
              price,
              currency: priceText.includes('$') ? 'USD' : 'GBP',
              imageUrl,
              sourceUrl: window.location.href,
              inStock: true, 
              description,
              publisher: details.publisher,
              isbn: details.isbn,
              pageCount: details.pages ? parseInt(details.pages.replace(/\D/g, '')) : undefined,
              publicationDate: details.publicationDate,
            };
          });

          if (productDetail && productDetail.title) {
            const fullImageUrl = productDetail.imageUrl && !productDetail.imageUrl.startsWith('http') ? 
              `${this.baseUrl}${productDetail.imageUrl}` : 
              productDetail.imageUrl;

            result = {
              sourceId: SanitizationUtil.removeControlCharacters(productDetail.sourceId),
              title: SanitizationUtil.sanitizeHtml(productDetail.title),
              author: productDetail.author ? SanitizationUtil.sanitizeHtml(productDetail.author) : undefined,
              price: SanitizationUtil.sanitizePrice(productDetail.price),
              currency: productDetail.currency,
              imageUrl: fullImageUrl ? SanitizationUtil.sanitizeUrl(fullImageUrl) : undefined,
              sourceUrl: SanitizationUtil.sanitizeUrl(productDetail.sourceUrl),
              inStock: productDetail.inStock,
              description: productDetail.description ? SanitizationUtil.sanitizeHtml(productDetail.description) : undefined,
              publisher: productDetail.publisher ? SanitizationUtil.sanitizeHtml(productDetail.publisher) : undefined,
              isbn: productDetail.isbn ? SanitizationUtil.removeControlCharacters(productDetail.isbn) : undefined,
              pageCount: productDetail.pageCount,
              publicationDate: productDetail.publicationDate ? SanitizationUtil.removeControlCharacters(productDetail.publicationDate) : undefined,
            };
          }

        } catch (error) {
          this.logger.error(`Failed to scrape product details: ${error.message}`);
          throw error;
        }
      },
      failedRequestHandler: async ({ request, error }) => {
        this.logger.error(`Product detail request failed: ${request.url} - ${(error as Error).message}`);
      },
    });

    try {
      await crawler.run([productUrl]);
      
      if (result) {
        this.logger.log(`Successfully scraped product details: ${result.title}`);
      } else {
        this.logger.warn('No product details extracted');
      }
      
      return result;
    } catch (error) {
      throw new ScrapingException(`Product detail scraping failed: ${error.message}`, error);
    } finally {
      await crawler.teardown();
    }
  }

 
  async testSiteAccess(): Promise<{ accessible: boolean; title: string; error?: string }> {
    this.logger.log('Testing World of Books site access...');

    const crawler = new PlaywrightCrawler({
      ...this.createCrawlerConfig(),
      requestHandler: async ({ page }) => {
        await page.setExtraHTTPHeaders({
          'User-Agent': this.userAgent,
        });

        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const title = await page.title();
        this.logger.log(`Site accessible. Page title: ${title}`);
      },
      failedRequestHandler: async ({ request, error }) => {
        this.logger.error(`Site access test failed: ${(error as Error).message}`);
        throw error;
      },
    });

    try {
      let result = { accessible: false, title: '' };
      
      await crawler.run([this.baseUrl]);
      result = { accessible: true, title: 'World of Books' };
      
      return result;
    } catch (error) {
      return {
        accessible: false,
        title: '',
        error: error.message,
      };
    } finally {
      await crawler.teardown();
    }
  }
}