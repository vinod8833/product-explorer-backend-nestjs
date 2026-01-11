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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedProductController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const product_service_1 = require("./product.service");
const cache_service_1 = require("../../common/services/cache.service");
const rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
const product_dto_1 = require("./dto/product.dto");
let EnhancedProductController = class EnhancedProductController {
    constructor(productService, cacheService) {
        this.productService = productService;
        this.cacheService = cacheService;
    }
    async getProducts(query, page = 1, limit = 20, includeFacets = false) {
        const startTime = Date.now();
        const sanitizedQuery = this.sanitizeQuery(query);
        const validatedPagination = this.validatePagination(page, limit);
        const cacheKey = this.generateCacheKey('products', {
            ...sanitizedQuery,
            ...validatedPagination,
            facets: includeFacets
        });
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return {
                ...cached,
                searchTime: Date.now() - startTime
            };
        }
        const result = await this.productService.searchProducts(sanitizedQuery.q || '', validatedPagination);
        const response = {
            ...result,
            searchTime: Date.now() - startTime,
        };
        await this.cacheService.set(cacheKey, response, {
            ttl: 300,
            tags: ['products', 'search']
        });
        return response;
    }
    async getPopularProducts(limit = 20, timeframe = 'week') {
        const cacheKey = `popular_products_${timeframe}_${limit}`;
        return this.cacheService.get(cacheKey, {
            ttl: 1800,
            tags: ['products', 'popular'],
            fallback: () => this.productService.getPopularProducts(limit, timeframe)
        });
    }
    async getRecommendations(productId, limit = 10) {
        const cacheKey = `recommendations_${productId}_${limit}`;
        return this.cacheService.get(cacheKey, {
            ttl: 3600,
            tags: ['products', 'recommendations'],
            fallback: () => this.productService.getRecommendations(productId, limit)
        });
    }
    async getSearchSuggestions(query, limit = 10) {
        if (!query || query.length < 2) {
            return [];
        }
        const cacheKey = `suggestions_${query.toLowerCase()}_${limit}`;
        return this.cacheService.get(cacheKey, {
            ttl: 3600,
            tags: ['search', 'suggestions'],
            fallback: () => this.productService.getSearchSuggestions(query, limit)
        });
    }
    async getFacets(query) {
        const cacheKey = `facets_${query || 'all'}`;
        return this.cacheService.get(cacheKey, {
            ttl: 1800,
            tags: ['facets', 'search'],
            fallback: () => this.productService.getFacets(query)
        });
    }
    async getProduct(id, include) {
        const includes = include ? include.split(',') : [];
        const cacheKey = `product_${id}_${includes.join('_')}`;
        const product = await this.cacheService.get(cacheKey, {
            ttl: 1800,
            tags: ['products', `product_${id}`],
            fallback: () => this.productService.getProductById(id, includes)
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        await this.productService.trackView(id);
        return product;
    }
    async createProduct(createProductDto) {
        const product = await this.productService.createProduct(createProductDto);
        await this.invalidateProductCaches();
        return product;
    }
    async updateProduct(id, updateProductDto) {
        const product = await this.productService.updateProduct(id, updateProductDto);
        await this.invalidateProductCaches(id);
        return product;
    }
    async deleteProduct(id) {
        await this.productService.deleteProduct(id);
        await this.invalidateProductCaches(id);
    }
    async refreshProduct(id) {
        const jobId = await this.productService.queueProductRefresh(id);
        return {
            message: 'Product refresh queued successfully',
            jobId
        };
    }
    async getSearchAnalytics(days = 7) {
        const cacheKey = `search_analytics_${days}`;
        return this.cacheService.get(cacheKey, {
            ttl: 3600,
            tags: ['analytics', 'search'],
            fallback: () => this.productService.getSearchAnalytics(days)
        });
    }
    sanitizeQuery(query) {
        return {
            ...query,
            q: query.q?.trim().substring(0, 200),
            author: query.author?.trim().substring(0, 100),
            publisher: query.publisher?.trim().substring(0, 100),
        };
    }
    validatePagination(page, limit) {
        return {
            page: Math.max(1, page),
            limit: Math.min(100, Math.max(1, limit))
        };
    }
    generateCacheKey(prefix, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
            result[key] = params[key];
            return result;
        }, {});
        return `${prefix}_${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
    }
    async invalidateProductCaches(productId) {
        const patterns = [
            'products_*',
            'popular_products_*',
            'facets_*',
            'search_analytics_*'
        ];
        if (productId) {
            patterns.push(`product_${productId}_*`);
            patterns.push(`recommendations_${productId}_*`);
        }
        await Promise.all(patterns.map(pattern => this.cacheService.invalidateByPattern(pattern)));
        await Promise.all([
            this.cacheService.invalidateByTag('products'),
            this.cacheService.invalidateByTag('search'),
            this.cacheService.invalidateByTag('facets')
        ]);
    }
};
exports.EnhancedProductController = EnhancedProductController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get products with advanced filtering and search',
        description: 'Supports full-text search, faceted filtering, and intelligent pagination'
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number (1-based)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page (max 100)' }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, description: 'Sort field' }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, description: 'Sort order (ASC/DESC)' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, description: 'Filter by category ID' }),
    (0, swagger_1.ApiQuery)({ name: 'minPrice', required: false, description: 'Minimum price filter' }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', required: false, description: 'Maximum price filter' }),
    (0, swagger_1.ApiQuery)({ name: 'author', required: false, description: 'Filter by author' }),
    (0, swagger_1.ApiQuery)({ name: 'inStock', required: false, description: 'Filter by stock status' }),
    (0, swagger_1.ApiQuery)({ name: 'facets', required: false, description: 'Include faceted search results' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Products retrieved successfully' }),
    __param(0, (0, common_1.Query)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('facets')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.ProductQueryDto, Number, Number, Boolean]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get popular products',
        description: 'Returns trending and popular products based on views and ratings'
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of products to return' }),
    (0, swagger_1.ApiQuery)({ name: 'timeframe', required: false, description: 'Time frame (day/week/month)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Popular products retrieved successfully' }),
    __param(0, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "getPopularProducts", null);
__decorate([
    (0, common_1.Get)('recommendations/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get product recommendations',
        description: 'Returns personalized product recommendations based on the given product'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of recommendations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recommendations retrieved successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('search/suggestions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get search suggestions',
        description: 'Returns autocomplete suggestions for search queries'
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Partial search query' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of suggestions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggestions retrieved successfully' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "getSearchSuggestions", null);
__decorate([
    (0, common_1.Get)('facets'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get search facets',
        description: 'Returns available facets for filtering products'
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search query to scope facets' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Facets retrieved successfully' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "getFacets", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get product by ID',
        description: 'Returns detailed product information including reviews and recommendations'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiQuery)({ name: 'include', required: false, description: 'Additional data to include (reviews,recommendations)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('include')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new product',
        description: 'Creates a new product (admin only)'
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Product created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update product',
        description: 'Updates an existing product (admin only)'
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete product',
        description: 'Deletes a product (admin only)'
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Product deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Post)(':id/refresh'),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh product data',
        description: 'Triggers a fresh scrape of product data'
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Refresh job queued successfully' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "refreshProduct", null);
__decorate([
    (0, common_1.Get)('analytics/search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get search analytics',
        description: 'Returns search analytics and trends (admin only)'
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Number of days to analyze' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    __param(0, (0, common_1.Query)('days', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EnhancedProductController.prototype, "getSearchAnalytics", null);
exports.EnhancedProductController = EnhancedProductController = __decorate([
    (0, swagger_1.ApiTags)('Products'),
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    __metadata("design:paramtypes", [product_service_1.ProductService,
        cache_service_1.CacheService])
], EnhancedProductController);
//# sourceMappingURL=enhanced-product.controller.js.map