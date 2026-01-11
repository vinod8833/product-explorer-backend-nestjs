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
var WorldOfBooksApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldOfBooksApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const custom_exceptions_1 = require("../../common/exceptions/custom-exceptions");
const sanitization_util_1 = require("../../common/utils/sanitization.util");
let WorldOfBooksApiService = WorldOfBooksApiService_1 = class WorldOfBooksApiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WorldOfBooksApiService_1.name);
        this.algoliaBaseUrl = 'https://ar33g9njgj-dsn.algolia.net/1/indexes/*/queries';
        this.algoliaAppId = 'AR33G9NJGJ';
        this.algoliaApiKey = '96c16938971ef89ae1d14e21494e2114';
        this.indexName = 'shopify_products_us';
        this.rateLimiter = {
            lastRequest: 0,
            requestCount: 0,
            resetTime: 0,
        };
        this.maxRequestsPerMinute = 60;
        this.minRequestInterval = 1000;
        this.cache = new Map();
        this.defaultCacheTTL = 5 * 60 * 1000;
        this.baseUrl = this.configService.get('WOB_BASE_URL', 'https://www.worldofbooks.com');
        this.userAgent = this.configService.get('WOB_USER_AGENT', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');
    }
    async enforceRateLimit() {
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
    getCacheKey(requests) {
        return `algolia:${JSON.stringify(requests)}`;
    }
    getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.timestamp + entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    setCache(key, data, ttl = this.defaultCacheTTL) {
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
    async makeAlgoliaRequest(requests) {
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
        }
        catch (error) {
            this.logger.error(`Algolia API request failed: ${error.message}`);
            throw new custom_exceptions_1.ScrapingException(`Failed to fetch data from Algolia API: ${error.message}`, error);
        }
    }
    buildFilters(filters) {
        const filterParts = [];
        filterParts.push('inStock:true');
        filterParts.push('productType:Book');
        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
            const min = filters.priceMin || 0.01;
            const max = filters.priceMax || 999999;
            filterParts.push(`bestConditionPrice: ${min} TO ${max}`);
        }
        else {
            filterParts.push('fromPrice > 0');
        }
        if (filters.conditions && filters.conditions.length > 0) {
            const conditionFilter = filters.conditions
                .map(condition => `availableConditions:${condition}`)
                .join(' OR ');
            filterParts.push(`(${conditionFilter})`);
        }
        else {
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
    buildFacetFilters(filters) {
        const facetFilters = [];
        if (filters.categories && filters.categories.length > 0) {
            facetFilters.push(filters.categories.map(cat => `collection_ids:${cat}`));
        }
        return facetFilters;
    }
    convertAlgoliaProductToProductItem(algoliaProduct) {
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
            title: sanitization_util_1.SanitizationUtil.sanitizeHtml(title),
            author: algoliaProduct.author ? sanitization_util_1.SanitizationUtil.sanitizeHtml(algoliaProduct.author) : undefined,
            price: sanitization_util_1.SanitizationUtil.sanitizePrice(algoliaProduct.bestConditionPrice || algoliaProduct.fromPrice || 0),
            currency: algoliaProduct.currency || 'USD',
            imageUrl: imageUrl ? sanitization_util_1.SanitizationUtil.sanitizeUrl(imageUrl) : undefined,
            sourceUrl: sanitization_util_1.SanitizationUtil.sanitizeUrl(productUrl.startsWith('http') ? productUrl : `${this.baseUrl}${productUrl}`),
            inStock: algoliaProduct.inStock,
        };
    }
    convertAlgoliaProductToDetailItem(algoliaProduct) {
        const baseProduct = this.convertAlgoliaProductToProductItem(algoliaProduct);
        return {
            ...baseProduct,
            description: algoliaProduct.description ? sanitization_util_1.SanitizationUtil.sanitizeHtml(algoliaProduct.description) : undefined,
            publisher: algoliaProduct.publisher ? sanitization_util_1.SanitizationUtil.sanitizeHtml(algoliaProduct.publisher) : undefined,
            isbn: algoliaProduct.isbn13 || algoliaProduct.isbn10 || algoliaProduct.isbn ?
                sanitization_util_1.SanitizationUtil.removeControlCharacters(algoliaProduct.isbn13 || algoliaProduct.isbn10 || algoliaProduct.isbn) : undefined,
            pageCount: algoliaProduct.pageCount,
            publicationDate: algoliaProduct.datePublished || algoliaProduct.publicationDate ?
                sanitization_util_1.SanitizationUtil.removeControlCharacters(algoliaProduct.datePublished || algoliaProduct.publicationDate) : undefined,
            genres: algoliaProduct.hierarchicalCategories ? [
                algoliaProduct.hierarchicalCategories.lvl0,
                algoliaProduct.hierarchicalCategories.lvl1,
                algoliaProduct.hierarchicalCategories.lvl2,
            ].filter(Boolean).map(genre => sanitization_util_1.SanitizationUtil.sanitizeHtml(genre)) : undefined,
        };
    }
    async searchProducts(filters = {}, page = 0, hitsPerPage = 20) {
        this.logger.log(`Searching products with filters: ${JSON.stringify(filters)}`);
        const searchRequest = {
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
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Product search failed: ${error.message}`, error);
        }
    }
    async getProductsByIds(productIds) {
        this.logger.log(`Fetching products by IDs: ${productIds.join(', ')}`);
        if (productIds.length === 0) {
            return [];
        }
        const idFilters = productIds.map(id => `id = ${id}`).join(' OR ');
        const searchRequest = {
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
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Failed to fetch products by IDs: ${error.message}`, error);
        }
    }
    async getProductsByCollection(collectionId, page = 0, hitsPerPage = 20) {
        this.logger.log(`Fetching products from collection: ${collectionId}`);
        const searchRequest = {
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
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Failed to fetch products from collection: ${error.message}`, error);
        }
    }
    async getBudgetBooks(maxPrice = 2.99, page = 0, hitsPerPage = 20) {
        this.logger.log(`Fetching budget books under ${maxPrice}`);
        const searchRequest = {
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
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Failed to fetch budget books: ${error.message}`, error);
        }
    }
    async getAdvancedSearch(searchOptions = {}) {
        const { query = '', priceMin = 0.01, priceMax = 999999, author, publisher, conditions = ['LIKE_NEW', 'VERY_GOOD', 'GOOD', 'WELL_READ'], categories = [], page = 0, hitsPerPage = 20 } = searchOptions;
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
        const facetFilters = [];
        if (categories.length > 0) {
            facetFilters.push(categories.map(cat => `hierarchicalCategories.lvl0:${cat}`));
        }
        const searchRequest = {
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
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Advanced search failed: ${error.message}`, error);
        }
    }
    async getProductDetail(productId) {
        this.logger.log(`Fetching product detail for ID: ${productId}`);
        try {
            const products = await this.getProductsByIds([productId]);
            if (products.length === 0) {
                this.logger.warn(`No product found with ID: ${productId}`);
                return null;
            }
            const product = products[0];
            const detailItem = {
                ...product,
            };
            this.logger.log(`Successfully fetched product detail for: ${product.title}`);
            return detailItem;
        }
        catch (error) {
            throw new custom_exceptions_1.ScrapingException(`Failed to fetch product detail: ${error.message}`, error);
        }
    }
    async getCartInfo() {
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
        }
        catch (error) {
            this.logger.error(`Failed to fetch cart info: ${error.message}`);
            throw new custom_exceptions_1.ScrapingException(`Failed to fetch cart information: ${error.message}`, error);
        }
    }
};
exports.WorldOfBooksApiService = WorldOfBooksApiService;
WorldOfBooksApiService.COLLECTIONS = {
    SALE_COLLECTION_1: '520304558353',
    SALE_COLLECTION_2: '520304722193',
    SALE_COLLECTION_3: '520304820497',
};
WorldOfBooksApiService.CONDITIONS = {
    LIKE_NEW: 'LIKE_NEW',
    VERY_GOOD: 'VERY_GOOD',
    GOOD: 'GOOD',
    WELL_READ: 'WELL_READ',
};
WorldOfBooksApiService.BINDING_TYPES = {
    PAPERBACK: 'Paperback',
    HARDCOVER: 'Hardcover',
    MASS_MARKET: 'Mass Market Paperback',
};
exports.WorldOfBooksApiService = WorldOfBooksApiService = WorldOfBooksApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WorldOfBooksApiService);
//# sourceMappingURL=world-of-books-api.service.js.map