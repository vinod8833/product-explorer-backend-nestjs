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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const product_service_1 = require("./product.service");
const world_of_books_api_service_1 = require("../scraping/world-of-books-api.service");
const product_dto_1 = require("./dto/product.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ProductController = ProductController_1 = class ProductController {
    constructor(productService, worldOfBooksApiService) {
        this.productService = productService;
        this.worldOfBooksApiService = worldOfBooksApiService;
        this.logger = new common_1.Logger(ProductController_1.name);
    }
    async findAll(paginationDto, searchDto) {
        const page = paginationDto.page || 1;
        const limit = paginationDto.limit || 20;
        return this.productService.findAll({ page, limit }, searchDto);
    }
    async findMixed(paginationDto, searchDto) {
        const { page = 1, limit = 20 } = paginationDto;
        try {
            const localProducts = await this.productService.findAll({ page, limit: Math.floor(limit / 2) }, searchDto);
            const remainingSlots = limit - localProducts.data.length;
            let liveProducts = { products: [], totalHits: 0, currentPage: 0, totalPages: 0 };
            if (remainingSlots > 0) {
                const liveFilters = {
                    query: searchDto.q,
                    author: searchDto.author,
                    priceMin: searchDto.minPrice,
                    priceMax: searchDto.maxPrice,
                    conditions: searchDto.conditions ? searchDto.conditions.split(',') : undefined,
                };
                liveProducts = await this.worldOfBooksApiService.searchProducts(liveFilters, page - 1, remainingSlots);
            }
            const transformedLiveProducts = liveProducts.products.map(product => ({
                id: parseInt(product.sourceId) || Math.random() * 1000000,
                sourceId: product.sourceId,
                categoryId: null,
                title: product.title,
                author: product.author,
                price: product.price,
                currency: product.currency,
                imageUrl: product.imageUrl,
                sourceUrl: product.sourceUrl,
                inStock: product.inStock,
                lastScrapedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                isLive: true,
            }));
            const combinedData = [...localProducts.data, ...transformedLiveProducts];
            const totalCombined = localProducts.total + liveProducts.totalHits;
            return {
                data: combinedData,
                total: totalCombined,
                page,
                limit,
                totalPages: Math.ceil(totalCombined / limit),
                hasNext: page < Math.ceil(totalCombined / limit),
                hasPrev: page > 1,
            };
        }
        catch (error) {
            this.logger.error('Error in mixed search:', error);
            return this.productService.findAll({ page, limit }, searchDto);
        }
    }
    async findByCategory(categoryId, paginationDto, searchDto) {
        return this.productService.findByCategory(categoryId, paginationDto, searchDto);
    }
    async search(query, paginationDto) {
        return this.productService.search(query, paginationDto);
    }
    async findOne(id) {
        return this.productService.findOne(id);
    }
    async findBySourceId(sourceId) {
        return this.productService.findBySourceId(sourceId);
    }
    async create(createProductDto) {
        return this.productService.create(createProductDto);
    }
    async update(id, updateProductDto) {
        return this.productService.update(id, updateProductDto);
    }
    async remove(id) {
        return this.productService.remove(id);
    }
    async searchLive(paginationDto, searchDto) {
        const { page = 1, limit = 20 } = paginationDto;
        const filters = {
            query: searchDto.q,
            author: searchDto.author,
            priceMin: searchDto.minPrice,
            priceMax: searchDto.maxPrice,
            conditions: searchDto.conditions ? searchDto.conditions.split(',') : undefined,
        };
        const result = await this.worldOfBooksApiService.searchProducts(filters, page - 1, limit);
        return {
            data: result.products,
            total: result.totalHits,
            page: result.currentPage + 1,
            totalPages: result.totalPages,
            hasNext: result.currentPage + 1 < result.totalPages,
            hasPrev: result.currentPage > 0,
        };
    }
    async advancedSearchLive(paginationDto, searchDto) {
        const { page = 1, limit = 20 } = paginationDto;
        const searchOptions = {
            query: searchDto.q,
            author: searchDto.author,
            publisher: searchDto.publisher,
            priceMin: searchDto.minPrice,
            priceMax: searchDto.maxPrice,
            conditions: searchDto.conditions ? searchDto.conditions.split(',') : undefined,
            categories: searchDto.categories ? searchDto.categories.split(',') : undefined,
            page: page - 1,
            hitsPerPage: limit,
        };
        const result = await this.worldOfBooksApiService.getAdvancedSearch(searchOptions);
        return {
            data: result.products,
            total: result.totalHits,
            page: result.currentPage + 1,
            totalPages: result.totalPages,
            hasNext: result.currentPage + 1 < result.totalPages,
            hasPrev: result.currentPage > 0,
            facets: result.facets,
        };
    }
    async getBudgetBooks(paginationDto, maxPrice) {
        const { page = 1, limit = 20 } = paginationDto;
        const result = await this.worldOfBooksApiService.getBudgetBooks(maxPrice || 2.99, page - 1, limit);
        return {
            data: result.products,
            total: result.totalHits,
            page: result.currentPage + 1,
            totalPages: result.totalPages,
            hasNext: result.currentPage + 1 < result.totalPages,
            hasPrev: result.currentPage > 0,
        };
    }
    async getCollectionProducts(collectionId, paginationDto) {
        const { page = 1, limit = 20 } = paginationDto;
        const result = await this.worldOfBooksApiService.getProductsByCollection(collectionId, page - 1, limit);
        return {
            data: result.products,
            total: result.totalHits,
            page: result.currentPage + 1,
            totalPages: result.totalPages,
            hasNext: result.currentPage + 1 < result.totalPages,
            hasPrev: result.currentPage > 0,
        };
    }
    async getProductsByIds(ids) {
        const productIds = ids.split(',').map(id => id.trim());
        const products = await this.worldOfBooksApiService.getProductsByIds(productIds);
        return {
            data: products,
            total: products.length,
        };
    }
    async getCartInfo() {
        return this.worldOfBooksApiService.getCartInfo();
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all products with search and pagination' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of products',
        type: (pagination_dto_1.PaginatedResponseDto),
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto,
        product_dto_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mixed'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mixed products (local + live data)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Mixed paginated list of products',
        type: (pagination_dto_1.PaginatedResponseDto),
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto,
        product_dto_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findMixed", null);
__decorate([
    (0, common_1.Get)('category/:categoryId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get products by category ID' }),
    (0, swagger_1.ApiParam)({ name: 'categoryId', description: 'Category ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of products for category',
        type: (pagination_dto_1.PaginatedResponseDto),
    }),
    __param(0, (0, common_1.Param)('categoryId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pagination_dto_1.PaginationDto,
        product_dto_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search products by query' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated search results',
        type: (pagination_dto_1.PaginatedResponseDto),
    }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product by ID with full details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product details with reviews',
        type: product_dto_1.ProductDetailDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('source/:sourceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product by source ID' }),
    (0, swagger_1.ApiParam)({ name: 'sourceId', description: 'Source ID from World of Books' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product details',
        type: product_dto_1.ProductDetailDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('sourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findBySourceId", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new product' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Product created successfully',
        type: product_dto_1.ProductDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update product' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Product updated successfully',
        type: product_dto_1.ProductDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete product' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('live/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search products using World of Books API (live data)' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'author', description: 'Filter by author', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'minPrice', description: 'Minimum price', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', description: 'Maximum price', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'conditions', description: 'Book conditions (comma-separated)', required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Live search results from World of Books',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto,
        product_dto_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "searchLive", null);
__decorate([
    (0, common_1.Get)('live/advanced'),
    (0, swagger_1.ApiOperation)({ summary: 'Advanced search with multiple filters (live data)' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'author', description: 'Filter by author', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'publisher', description: 'Filter by publisher', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'minPrice', description: 'Minimum price', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', description: 'Maximum price', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'conditions', description: 'Book conditions (comma-separated)', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'categories', description: 'Categories (comma-separated)', required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Advanced search results from World of Books',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto,
        product_dto_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "advancedSearchLive", null);
__decorate([
    (0, common_1.Get)('live/budget'),
    (0, swagger_1.ApiOperation)({ summary: 'Get budget books under specified price (live data)' }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', description: 'Maximum price', required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Budget books from World of Books',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('maxPrice')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, Number]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getBudgetBooks", null);
__decorate([
    (0, common_1.Get)('live/collection/:collectionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get products from a specific collection (live data)' }),
    (0, swagger_1.ApiParam)({ name: 'collectionId', description: 'Collection ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Products from collection',
    }),
    __param(0, (0, common_1.Param)('collectionId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getCollectionProducts", null);
__decorate([
    (0, common_1.Get)('live/ids'),
    (0, swagger_1.ApiOperation)({ summary: 'Get products by specific IDs (live data)' }),
    (0, swagger_1.ApiQuery)({ name: 'ids', description: 'Comma-separated product IDs' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Products by IDs',
    }),
    __param(0, (0, common_1.Query)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getProductsByIds", null);
__decorate([
    (0, common_1.Get)('live/cart'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cart information (live data)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cart information',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getCartInfo", null);
exports.ProductController = ProductController = ProductController_1 = __decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [product_service_1.ProductService,
        world_of_books_api_service_1.WorldOfBooksApiService])
], ProductController);
//# sourceMappingURL=product.controller.js.map