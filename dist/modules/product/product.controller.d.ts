import { ProductService } from './product.service';
import { WorldOfBooksApiService } from '../scraping/world-of-books-api.service';
import { ProductDto, ProductDetailDto, CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
export declare class ProductController {
    private readonly productService;
    private readonly worldOfBooksApiService;
    private readonly logger;
    constructor(productService: ProductService, worldOfBooksApiService: WorldOfBooksApiService);
    findAll(paginationDto: PaginationDto, searchDto: ProductQueryDto): Promise<PaginatedResponseDto<ProductDto>>;
    findMixed(paginationDto: PaginationDto, searchDto: ProductQueryDto): Promise<PaginatedResponseDto<ProductDto>>;
    findByCategory(categoryId: number, paginationDto: PaginationDto, searchDto: ProductQueryDto): Promise<PaginatedResponseDto<ProductDto>>;
    search(query: string, paginationDto: PaginationDto): Promise<PaginatedResponseDto<ProductDto>>;
    findOne(id: number): Promise<ProductDetailDto>;
    findBySourceId(sourceId: string): Promise<ProductDetailDto>;
    create(createProductDto: CreateProductDto): Promise<ProductDto>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<ProductDto>;
    remove(id: number): Promise<void>;
    searchLive(paginationDto: PaginationDto, searchDto: ProductQueryDto): Promise<{
        data: import("../scraping/world-of-books-scraper.service").ProductItem[];
        total: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    advancedSearchLive(paginationDto: PaginationDto, searchDto: ProductQueryDto): Promise<{
        data: import("../scraping/world-of-books-scraper.service").ProductItem[];
        total: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
        facets: any;
    }>;
    getBudgetBooks(paginationDto: PaginationDto, maxPrice?: number): Promise<{
        data: import("../scraping/world-of-books-scraper.service").ProductItem[];
        total: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    getCollectionProducts(collectionId: string, paginationDto: PaginationDto): Promise<{
        data: import("../scraping/world-of-books-scraper.service").ProductItem[];
        total: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    getProductsByIds(ids: string): Promise<{
        data: import("../scraping/world-of-books-scraper.service").ProductItem[];
        total: number;
    }>;
    getCartInfo(): Promise<any>;
}
