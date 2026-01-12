import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScrapingException } from '../../common/exceptions/custom-exceptions';
import { SanitizationUtil } from '../../common/utils/sanitization.util';
import { ProductItem, ProductDetailItem } from './world-of-books-scraper.service';

interface RateLimiter {
  lastRequest: number;
  requestCount: number;
  resetTime: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface AlgoliaSearchRequest {
  indexName: string;
  hitsPerPage?: number;
  filters?: string;
  facetFilters?: string[][];
  page?: number;
  query?: string;
  clickAnalytics?: boolean;
  facets?: string[];
  highlightPostTag?: string;
  highlightPreTag?: string;
  maxValuesPerFacet?: number;
  userToken?: string;
}

export interface AlgoliaSearchResponse {
  hits: AlgoliaProduct[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  exhaustiveNbHits: boolean;
  exhaustiveTypo: boolean;
  query: string;
  params: string;
  processingTimeMS: number;
  facets?: Record<string, Record<string, number>>;
}

export interface AlgoliaProduct {
  objectID: string;
  id: string;
  shortTitle?: string;
  longTitle?: string;
  legacyTitle?: string;
  title?: string; 
  author?: string;
  publisher?: string;
  isbn10?: string;
  isbn13?: string;
  isbn?: string; 
  fromPrice: number;
  bestConditionPrice: number;
  currency?: string;
  imageURL?: string;
  imageUrl?: string; 
  productHandle?: string;
  productUrl?: string; 
  inStock: boolean;
  availableConditions: string[];
  bindingType?: string;
  productType: string;
  description?: string;
  datePublished?: string;
  publicationDate?: string; 
  yearPublished?: number;
  pageCount?: number;
  hierarchicalCategories?: {
    lvl0?: string;
    lvl1?: string;
    lvl2?: string;
  };
  _highlightResult?: any;
}

export interface SearchFilters {
  priceMin?: number;
  priceMax?: number;
  conditions?: string[];
  author?: string;
  publisher?: string;
  bindingType?: string;
  categories?: string[];
  inStock?: boolean;
  query?: string;
}

@Injectable()
export class WorldOfBooksApiService {
  private readonly logger = new Logger(WorldOfBooksApiService.name);
  private readonly algoliaBaseUrl = 'https://ar33g9njgj-dsn.algolia.net/1/indexes/*/queries';
  private readonly algoliaAppId = 'AR33G9NJGJ';
  private readonly algoliaApiKey = '96c16938971ef89ae1d14e21494e2114';
  private readonly indexName = 'shopify_products_us';
  private readonly baseUrl: string;
  private readonly userAgent: string;

  private rateLimiter: RateLimiter = {
    lastRequest: 0,
    requestCount: 0,
    resetTime: 0,
  };
  private readonly maxRequestsPerMinute = 60;
  private readonly minRequestInterval = 1000; 

  private cache = new Map<string, CacheEntry>();
  private readonly defaultCacheTTL = 5 * 60 * 1000; 

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('WOB_BASE_URL', 'https://www.worldofbooks.com');
    this.userAgent = this.configService.get(
      'WOB_USER_AGENT',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    );
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    if (now > this.rateLimiter.resetTime) {
      this.rateLimiter.requestCount = 0;
      this.rateLimiter.resetTime = now + 60000; 
    }

    if (this.rateLimiter.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = this.rateLimiter.resetTime - now;
      this.logger.warn(`Rate limit exceeded. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimiter.requestCount = 0;
      this.rateLimiter.resetTime = Date.now() + 60000;
    }

    const timeSinceLastRequest = now - this.rateLimiter.lastRequest;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.rateLimiter.lastRequest = Date.now();
    this.rateLimiter.requestCount++;
  }

  private getCacheKey(requests: AlgoliaSearchRequest[]): string {
    return `algolia:${JSON.stringify(requests)}`;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number = this.defaultCacheTTL): void {
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private async makeAlgoliaRequest(requests: AlgoliaSearchRequest[]): Promise<AlgoliaSearchResponse[]> {
    const cacheKey = this.getCacheKey(requests);
    
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.logger.debug('Returning cached result');
      return cachedResult;
    }

    try {
      await this.enforceRateLimit();

      const response = await fetch(this.algoliaBaseUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'text/plain',
          'User-Agent': this.userAgent,
          'x-algolia-api-key': this.algoliaApiKey,
          'x-algolia-application-id': this.algoliaAppId,
          'x-algolia-agent': 'Algolia for JavaScript (5.40.1); Lite (5.40.1); Browser; instantsearch.js (4.81.0); JS Helper (3.26.0)',
          'Origin': 'https://www.worldofbooks.com',
          'Referer': 'https://www.worldofbooks.com/',
          'Accept-Language': 'en-US,en;q=0.9',
          'DNT': '1',
        },
        body: JSON.stringify({ requests }),
      });

      if (!response.ok) {
        throw new Error(`Algolia API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.results || [];

      this.setCache(cacheKey, results);

      this.logger.debug(`Algolia API request successful: ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Algolia API request failed: ${error.message}`);
      throw new ScrapingException(`Failed to fetch data from Algolia API: ${error.message}`, error);
    }
  }

  private buildFilters(filters: SearchFilters): string {
    const filterParts: string[] = [];

    filterParts.push('inStock:true');
    filterParts.push('productType:Book');
    
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const min = filters.priceMin || 0.01;
      const max = filters.priceMax || 999999;
      filterParts.push(`bestConditionPrice: ${min} TO ${max}`);
    } else {
      filterParts.push('fromPrice > 0');
    }

    if (filters.conditions && filters.conditions.length > 0) {
      const conditionFilter = filters.conditions
        .map(condition => `availableConditions:${condition}`)
        .join(' OR ');
      filterParts.push(`(${conditionFilter})`);
    } else {
      filterParts.push('(availableConditions:LIKE_NEW OR availableConditions:VERY_GOOD OR availableConditions:GOOD OR availableConditions:WELL_READ)');
    }

    if (filters.author) {
      filterParts.push(`author:"${filters.author}"`);
    }

    if (filters.publisher) {
      filterParts.push(`publisher:"${filters.publisher}"`);
    }

    if (filters.bindingType) {
      filterParts.push(`bindingType:"${filters.bindingType}"`);
    }

    return filterParts.join(' AND ');
  }

  private buildFacetFilters(filters: SearchFilters): string[][] {
    const facetFilters: string[][] = [];

    if (filters.categories && filters.categories.length > 0) {
      facetFilters.push(filters.categories.map(cat => `collection_ids:${cat}`));
    }

    return facetFilters;
  }

  private convertAlgoliaProductToProductItem(algoliaProduct: AlgoliaProduct): ProductItem {
    const title = algoliaProduct.legacyTitle || 
                  algoliaProduct.longTitle || 
                  algoliaProduct.shortTitle || 
                  algoliaProduct.title || 
                  '';

    const imageUrl = algoliaProduct.imageURL || algoliaProduct.imageUrl;

    const productUrl = algoliaProduct.productUrl || 
                      (algoliaProduct.productHandle ? 
                        `${this.baseUrl}/products/${algoliaProduct.productHandle}` : 
                        `${this.baseUrl}/products/${algoliaProduct.id}`);

    return {
      sourceId: algoliaProduct.id || algoliaProduct.objectID,
      title: SanitizationUtil.sanitizeHtml(title),
      author: algoliaProduct.author ? SanitizationUtil.sanitizeHtml(algoliaProduct.author) : undefined,
      price: SanitizationUtil.sanitizePrice(algoliaProduct.bestConditionPrice || algoliaProduct.fromPrice || 0),
      currency: algoliaProduct.currency || 'USD',
      imageUrl: imageUrl ? SanitizationUtil.sanitizeUrl(imageUrl) : undefined,
      sourceUrl: SanitizationUtil.sanitizeUrl(productUrl.startsWith('http') ? productUrl : `${this.baseUrl}${productUrl}`),
      inStock: algoliaProduct.inStock,
    };
  }

  private convertAlgoliaProductToDetailItem(algoliaProduct: AlgoliaProduct): ProductDetailItem {
    const baseProduct = this.convertAlgoliaProductToProductItem(algoliaProduct);
    
    return {
      ...baseProduct,
      description: algoliaProduct.description ? SanitizationUtil.sanitizeHtml(algoliaProduct.description) : undefined,
      publisher: algoliaProduct.publisher ? SanitizationUtil.sanitizeHtml(algoliaProduct.publisher) : undefined,
      isbn: algoliaProduct.isbn13 || algoliaProduct.isbn10 || algoliaProduct.isbn ? 
        SanitizationUtil.removeControlCharacters(algoliaProduct.isbn13 || algoliaProduct.isbn10 || algoliaProduct.isbn!) : undefined,
      pageCount: algoliaProduct.pageCount,
      publicationDate: algoliaProduct.datePublished || algoliaProduct.publicationDate ? 
        SanitizationUtil.removeControlCharacters(algoliaProduct.datePublished || algoliaProduct.publicationDate!) : undefined,
      genres: algoliaProduct.hierarchicalCategories ? [
        algoliaProduct.hierarchicalCategories.lvl0,
        algoliaProduct.hierarchicalCategories.lvl1,
        algoliaProduct.hierarchicalCategories.lvl2,
      ].filter(Boolean).map(genre => SanitizationUtil.sanitizeHtml(genre!)) : undefined,
    };
  }

  async searchProducts(filters: SearchFilters = {}, page: number = 0, hitsPerPage: number = 20): Promise<{
    products: ProductItem[];
    totalHits: number;
    totalPages: number;
    currentPage: number;
  }> {
    this.logger.log(`Searching products with filters: ${JSON.stringify(filters)}`);

    const searchRequest: AlgoliaSearchRequest = {
      indexName: this.indexName,
      hitsPerPage,
      page,
      filters: this.buildFilters(filters),
      facetFilters: this.buildFacetFilters(filters),
      query: filters.query || '',
      clickAnalytics: true,
      facets: ['author', 'availableConditions', 'bindingType', 'hierarchicalCategories.lvl0', 'platform', 'priceRanges', 'productType', 'publisher'],
      highlightPostTag: '__/ais-highlight__',
      highlightPreTag: '__ais-highlight__',
      maxValuesPerFacet: 10,
      userToken: `anonymous-${Date.now()}`,
    };

    try {
      const results = await this.makeAlgoliaRequest([searchRequest]);
      
      if (!results || results.length === 0) {
        return {
          products: [],
          totalHits: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      const searchResult = results[0];
      const products = searchResult.hits.map(hit => this.convertAlgoliaProductToProductItem(hit));

      this.logger.log(`Found ${products.length} products out of ${searchResult.nbHits} total`);

      return {
        products,
        totalHits: searchResult.nbHits,
        totalPages: searchResult.nbPages,
        currentPage: searchResult.page,
      };
    } catch (error) {
      throw new ScrapingException(`Product search failed: ${error.message}`, error);
    }
  }

  async getProductsByIds(productIds: string[]): Promise<ProductItem[]> {
    this.logger.log(`Fetching products by IDs: ${productIds.join(', ')}`);

    if (productIds.length === 0) {
      return [];
    }

    const idFilters = productIds.map(id => `id = ${id}`).join(' OR ');
    
    const searchRequest: AlgoliaSearchRequest = {
      indexName: this.indexName,
      hitsPerPage: productIds.length,
      filters: `fromPrice > 0 AND inStock:true AND (${idFilters})`,
    };

    try {
      const results = await this.makeAlgoliaRequest([searchRequest]);
      
      if (!results || results.length === 0) {
        return [];
      }

      const products = results[0].hits.map(hit => this.convertAlgoliaProductToProductItem(hit));
      this.logger.log(`Found ${products.length} products by IDs`);
      
      return products;
    } catch (error) {
      throw new ScrapingException(`Failed to fetch products by IDs: ${error.message}`, error);
    }
  }

  async getProductsByCollection(collectionId: string, page: number = 0, hitsPerPage: number = 20): Promise<{
    products: ProductItem[];
    totalHits: number;
    totalPages: number;
    currentPage: number;
  }> {
    this.logger.log(`Fetching products from collection: ${collectionId}`);

    const searchRequest: AlgoliaSearchRequest = {
      indexName: this.indexName,
      hitsPerPage,
      page,
      filters: 'fromPrice > 0 AND (availableConditions:LIKE_NEW OR availableConditions:VERY_GOOD OR availableConditions:GOOD OR availableConditions:WELL_READ)',
      facetFilters: [[`collection_ids:${collectionId}`]],
    };

    try {
      const results = await this.makeAlgoliaRequest([searchRequest]);
      
      if (!results || results.length === 0) {
        return {
          products: [],
          totalHits: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      const searchResult = results[0];
      const products = searchResult.hits.map(hit => this.convertAlgoliaProductToProductItem(hit));

      this.logger.log(`Found ${products.length} products in collection ${collectionId}`);

      return {
        products,
        totalHits: searchResult.nbHits,
        totalPages: searchResult.nbPages,
        currentPage: searchResult.page,
      };
    } catch (error) {
      throw new ScrapingException(`Failed to fetch products from collection: ${error.message}`, error);
    }
  }

  async getBudgetBooks(maxPrice: number = 2.99, page: number = 0, hitsPerPage: number = 20): Promise<{
    products: ProductItem[];
    totalHits: number;
    totalPages: number;
    currentPage: number;
  }> {
    this.logger.log(`Fetching budget books under ${maxPrice}`);

    const searchRequest: AlgoliaSearchRequest = {
      indexName: this.indexName,
      hitsPerPage,
      page,
      filters: `inStock:true AND productType:Book AND bestConditionPrice: 0.01 TO ${maxPrice} AND (availableConditions:LIKE_NEW OR availableConditions:VERY_GOOD OR availableConditions:GOOD OR availableConditions:WELL_READ)`,
      clickAnalytics: true,
      facets: ['author', 'availableConditions', 'bindingType', 'hierarchicalCategories.lvl0', 'platform', 'priceRanges', 'productType', 'publisher'],
      highlightPostTag: '__/ais-highlight__',
      highlightPreTag: '__ais-highlight__',
      maxValuesPerFacet: 10,
      userToken: `anonymous-${Date.now()}`,
    };

    try {
      const results = await this.makeAlgoliaRequest([searchRequest]);
      
      if (!results || results.length === 0) {
        return {
          products: [],
          totalHits: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      const searchResult = results[0];
      const products = searchResult.hits.map(hit => this.convertAlgoliaProductToProductItem(hit));

      this.logger.log(`Found ${products.length} budget books under ${maxPrice}`);

      return {
        products,
        totalHits: searchResult.nbHits,
        totalPages: searchResult.nbPages,
        currentPage: searchResult.page,
      };
    } catch (error) {
      throw new ScrapingException(`Failed to fetch budget books: ${error.message}`, error);
    }
  }

  async getAdvancedSearch(searchOptions: {
    query?: string;
    priceMin?: number;
    priceMax?: number;
    author?: string;
    publisher?: string;
    conditions?: string[];
    categories?: string[];
    page?: number;
    hitsPerPage?: number;
  } = {}): Promise<{
    products: ProductItem[];
    totalHits: number;
    totalPages: number;
    currentPage: number;
    facets?: any;
  }> {
    const {
      query = '',
      priceMin = 0.01,
      priceMax = 999999,
      author,
      publisher,
      conditions = ['LIKE_NEW', 'VERY_GOOD', 'GOOD', 'WELL_READ'],
      categories = [],
      page = 0,
      hitsPerPage = 20
    } = searchOptions;

    this.logger.log(`Advanced search with options: ${JSON.stringify(searchOptions)}`);

    const filterParts = [
      'inStock:true',
      'productType:Book',
      `bestConditionPrice: ${priceMin} TO ${priceMax}`,
      `(${conditions.map(c => `availableConditions:${c}`).join(' OR ')})`
    ];

    if (author) {
      filterParts.push(`author:"${author}"`);
    }

    if (publisher) {
      filterParts.push(`publisher:"${publisher}"`);
    }

    const filters = filterParts.join(' AND ');

    const facetFilters: string[][] = [];
    if (categories.length > 0) {
      facetFilters.push(categories.map(cat => `hierarchicalCategories.lvl0:${cat}`));
    }

    const searchRequest: AlgoliaSearchRequest = {
      indexName: this.indexName,
      query,
      hitsPerPage,
      page,
      filters,
      facetFilters: facetFilters.length > 0 ? facetFilters : undefined,
      clickAnalytics: true,
      facets: ['author', 'availableConditions', 'bindingType', 'hierarchicalCategories.lvl0', 'platform', 'priceRanges', 'productType', 'publisher'],
      highlightPostTag: '__/ais-highlight__',
      highlightPreTag: '__ais-highlight__',
      maxValuesPerFacet: 10,
      userToken: `anonymous-${Date.now()}`,
    };

    try {
      const results = await this.makeAlgoliaRequest([searchRequest]);
      
      if (!results || results.length === 0) {
        return {
          products: [],
          totalHits: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      const searchResult = results[0];
      const products = searchResult.hits.map(hit => this.convertAlgoliaProductToProductItem(hit));

      this.logger.log(`Advanced search found ${products.length} products`);

      return {
        products,
        totalHits: searchResult.nbHits,
        totalPages: searchResult.nbPages,
        currentPage: searchResult.page,
        facets: searchResult.facets,
      };
    } catch (error) {
      throw new ScrapingException(`Advanced search failed: ${error.message}`, error);
    }
  }

  async getProductDetail(productId: string): Promise<ProductDetailItem | null> {
    this.logger.log(`Fetching product detail for ID: ${productId}`);

    try {
      const products = await this.getProductsByIds([productId]);
      
      if (products.length === 0) {
        this.logger.warn(`No product found with ID: ${productId}`);
        return null;
      }

      const product = products[0];
      const detailItem: ProductDetailItem = {
        ...product,
      };

      this.logger.log(`Successfully fetched product detail for: ${product.title}`);
      return detailItem;
    } catch (error) {
      throw new ScrapingException(`Failed to fetch product detail: ${error.message}`, error);
    }
  }

  async getCartInfo(): Promise<any> {
    this.logger.log('Fetching cart information');

    try {
      const response = await fetch(`${this.baseUrl}/cart.json?vsly=t`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': this.userAgent,
          'Referer': `${this.baseUrl}/collections/us-sale`,
        },
      });

      if (!response.ok) {
        throw new Error(`Cart API request failed: ${response.status} ${response.statusText}`);
      }

      const cartData = await response.json();
      this.logger.log('Successfully fetched cart information');
      
      return cartData;
    } catch (error) {
      this.logger.error(`Failed to fetch cart info: ${error.message}`);
      throw new ScrapingException(`Failed to fetch cart information: ${error.message}`, error);
    }
  }

  static readonly COLLECTIONS = {
    SALE_COLLECTION_1: '520304558353',
    SALE_COLLECTION_2: '520304722193', 
    SALE_COLLECTION_3: '520304820497',
  };

  static readonly CONDITIONS = {
    LIKE_NEW: 'LIKE_NEW',
    VERY_GOOD: 'VERY_GOOD',
    GOOD: 'GOOD',
    WELL_READ: 'WELL_READ',
  };

  static readonly BINDING_TYPES = {
    PAPERBACK: 'Paperback',
    HARDCOVER: 'Hardcover',
    MASS_MARKET: 'Mass Market Paperback',
  };
}