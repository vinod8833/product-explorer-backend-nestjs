import { ConfigService } from '@nestjs/config';
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
export declare class WorldOfBooksScraperService {
    private configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly userAgent;
    private readonly delayMin;
    private readonly delayMax;
    private readonly maxRetries;
    private readonly timeout;
    private readonly respectRobotsTxt;
    private readonly proxyUrls;
    constructor(configService: ConfigService);
    verifyImageUrl(imageUrl: string): Promise<boolean>;
    validateProductData(product: ProductItem): Promise<{
        isValid: boolean;
        missingFields: string[];
    }>;
    scrapeProductWithFallback(sourceId: string, existingProduct?: ProductItem): Promise<ProductItem | null>;
    private searchAndScrapeProduct;
    private getMockImageUrl;
    private constructProductUrl;
    scrapeOrGenerateImageUrl(product: ProductItem): Promise<string | null>;
    private generatePlaceholderImageUrl;
    scrapeProductsWithImageVerification(url: string, maxPages?: number): Promise<ProductItem[]>;
    private checkRobotsTxt;
    private createCrawlerConfig;
    private randomDelay;
    private safePageEvaluation;
    private generateSlug;
    scrapeNavigation(): Promise<NavigationItem[]>;
    scrapeCategories(navigationUrl: string, maxDepth?: number): Promise<CategoryItem[]>;
    scrapeProducts(categoryUrl: string, maxPages?: number): Promise<ProductItem[]>;
    scrapeProductDetail(productUrl: string): Promise<ProductDetailItem>;
    batchUpdateMissingImages(products: ProductItem[]): Promise<ProductItem[]>;
}
