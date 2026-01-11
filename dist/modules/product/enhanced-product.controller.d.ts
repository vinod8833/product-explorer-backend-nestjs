import { ProductService } from './product.service';
import { CacheService } from '../../common/services/cache.service';
import { ProductDto, ProductQueryDto, CreateProductDto, UpdateProductDto } from './dto/product.dto';
interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
interface SearchResponse<T> extends PaginatedResponse<T> {
    searchTime: number;
    suggestions?: string[];
    facets?: Record<string, any>;
}
export declare class EnhancedProductController {
    private readonly productService;
    private readonly cacheService;
    constructor(productService: ProductService, cacheService: CacheService);
    getProducts(query: ProductQueryDto, page?: number, limit?: number, includeFacets?: boolean): Promise<SearchResponse<ProductDto>>;
    getPopularProducts(limit?: number, timeframe?: string): Promise<ProductDto[]>;
    getRecommendations(productId: number, limit?: number): Promise<ProductDto[]>;
    getSearchSuggestions(query: string, limit?: number): Promise<string[]>;
    getFacets(query?: string): Promise<Record<string, any>>;
    getProduct(id: number, include?: string): Promise<ProductDto>;
    createProduct(createProductDto: CreateProductDto): Promise<ProductDto>;
    updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<ProductDto>;
    deleteProduct(id: number): Promise<void>;
    refreshProduct(id: number): Promise<{
        message: string;
        jobId: string;
    }>;
    getSearchAnalytics(days?: number): Promise<any>;
    private sanitizeQuery;
    private validatePagination;
    private generateCacheKey;
    private invalidateProductCaches;
}
export {};
