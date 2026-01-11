import { ConfigService } from '@nestjs/config';
import { ProductItem, ProductDetailItem } from './world-of-books-scraper.service';
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
export declare class WorldOfBooksApiService {
    private configService;
    private readonly logger;
    private readonly algoliaBaseUrl;
    private readonly algoliaAppId;
    private readonly algoliaApiKey;
    private readonly indexName;
    private readonly baseUrl;
    private readonly userAgent;
    private rateLimiter;
    private readonly maxRequestsPerMinute;
    private readonly minRequestInterval;
    private cache;
    private readonly defaultCacheTTL;
    constructor(configService: ConfigService);
    private enforceRateLimit;
    private getCacheKey;
    private getFromCache;
    private setCache;
    private makeAlgoliaRequest;
    private buildFilters;
    private buildFacetFilters;
    private convertAlgoliaProductToProductItem;
    private convertAlgoliaProductToDetailItem;
    searchProducts(filters?: SearchFilters, page?: number, hitsPerPage?: number): Promise<{
        products: ProductItem[];
        totalHits: number;
        totalPages: number;
        currentPage: number;
    }>;
    getProductsByIds(productIds: string[]): Promise<ProductItem[]>;
    getProductsByCollection(collectionId: string, page?: number, hitsPerPage?: number): Promise<{
        products: ProductItem[];
        totalHits: number;
        totalPages: number;
        currentPage: number;
    }>;
    getBudgetBooks(maxPrice?: number, page?: number, hitsPerPage?: number): Promise<{
        products: ProductItem[];
        totalHits: number;
        totalPages: number;
        currentPage: number;
    }>;
    getAdvancedSearch(searchOptions?: {
        query?: string;
        priceMin?: number;
        priceMax?: number;
        author?: string;
        publisher?: string;
        conditions?: string[];
        categories?: string[];
        page?: number;
        hitsPerPage?: number;
    }): Promise<{
        products: ProductItem[];
        totalHits: number;
        totalPages: number;
        currentPage: number;
        facets?: any;
    }>;
    getProductDetail(productId: string): Promise<ProductDetailItem | null>;
    getCartInfo(): Promise<any>;
    static readonly COLLECTIONS: {
        SALE_COLLECTION_1: string;
        SALE_COLLECTION_2: string;
        SALE_COLLECTION_3: string;
    };
    static readonly CONDITIONS: {
        LIKE_NEW: string;
        VERY_GOOD: string;
        GOOD: string;
        WELL_READ: string;
    };
    static readonly BINDING_TYPES: {
        PAPERBACK: string;
        HARDCOVER: string;
        MASS_MARKET: string;
    };
}
