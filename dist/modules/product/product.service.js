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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../database/entities/product.entity");
const product_detail_entity_1 = require("../../database/entities/product-detail.entity");
const review_entity_1 = require("../../database/entities/review.entity");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ProductService = class ProductService {
    constructor(productRepository, productDetailRepository, reviewRepository) {
        this.productRepository = productRepository;
        this.productDetailRepository = productDetailRepository;
        this.reviewRepository = reviewRepository;
    }
    async findAll(paginationDto, searchDto = {}) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const queryBuilder = this.buildSearchQuery(searchDto);
        const [products, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return new pagination_dto_1.PaginatedResponseDto(products, total, page, limit);
    }
    async findByCategory(categoryId, paginationDto, searchDto = {}) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const queryBuilder = this.buildSearchQuery({ ...searchDto, categoryId });
        const [products, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return new pagination_dto_1.PaginatedResponseDto(products, total, page, limit);
    }
    async findOne(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['category', 'detail', 'reviews'],
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }
    async findBySourceId(sourceId) {
        const product = await this.productRepository.findOne({
            where: { sourceId },
            relations: ['category', 'detail', 'reviews'],
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with source ID ${sourceId} not found`);
        }
        return product;
    }
    async create(createProductDto) {
        const product = this.productRepository.create(createProductDto);
        return this.productRepository.save(product);
    }
    async update(id, updateProductDto) {
        const product = await this.findOne(id);
        Object.assign(product, updateProductDto);
        return this.productRepository.save(product);
    }
    async remove(id) {
        const product = await this.findOne(id);
        await this.productRepository.remove(product);
    }
    async upsertBySourceId(sourceId, data) {
        const existing = await this.productRepository.findOne({ where: { sourceId } });
        if (existing) {
            Object.assign(existing, data, { lastScrapedAt: new Date() });
            return this.productRepository.save(existing);
        }
        const product = this.productRepository.create({
            ...data,
            sourceId,
            lastScrapedAt: new Date(),
        });
        return this.productRepository.save(product);
    }
    async createOrUpdateDetail(productId, detailData) {
        const existing = await this.productDetailRepository.findOne({ where: { productId } });
        if (existing) {
            Object.assign(existing, detailData);
            return this.productDetailRepository.save(existing);
        }
        const detail = this.productDetailRepository.create({
            ...detailData,
            productId,
        });
        return this.productDetailRepository.save(detail);
    }
    async addReview(productId, reviewData) {
        const review = this.reviewRepository.create({
            ...reviewData,
            productId,
        });
        return this.reviewRepository.save(review);
    }
    async search(query, paginationDto) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.detail', 'detail')
            .where('product.title ILIKE :query OR product.author ILIKE :query OR detail.description ILIKE :query', { query: `%${query}%` })
            .orderBy('product.title', 'ASC');
        const [products, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return new pagination_dto_1.PaginatedResponseDto(products, total, page, limit);
    }
    buildSearchQuery(searchDto) {
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.detail', 'detail')
            .leftJoinAndSelect('category.navigation', 'navigation');
        if (searchDto.q) {
            queryBuilder.andWhere('(product.title ILIKE :query OR product.author ILIKE :query OR detail.description ILIKE :query)', { query: `%${searchDto.q}%` });
        }
        if (searchDto.categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', {
                categoryId: searchDto.categoryId,
            });
        }
        if (searchDto.navigation) {
            queryBuilder.andWhere('navigation.slug = :navigationSlug', {
                navigationSlug: searchDto.navigation,
            });
        }
        if (searchDto.category) {
            queryBuilder.andWhere('category.slug = :categorySlug', {
                categorySlug: searchDto.category,
            });
        }
        if (searchDto.minPrice !== undefined) {
            queryBuilder.andWhere('product.price >= :minPrice', {
                minPrice: searchDto.minPrice,
            });
        }
        if (searchDto.maxPrice !== undefined) {
            queryBuilder.andWhere('product.price <= :maxPrice', {
                maxPrice: searchDto.maxPrice,
            });
        }
        if (searchDto.author) {
            queryBuilder.andWhere('product.author ILIKE :author', {
                author: `%${searchDto.author}%`,
            });
        }
        if (searchDto.inStock !== undefined) {
            queryBuilder.andWhere('product.inStock = :inStock', {
                inStock: searchDto.inStock,
            });
        }
        const sortBy = searchDto.sortBy || 'id';
        const sortOrder = searchDto.sortOrder || 'DESC';
        if (sortBy === 'price') {
            queryBuilder.orderBy('product.price', sortOrder);
        }
        else if (sortBy === 'rating') {
            queryBuilder.orderBy('detail.ratingsAvg', sortOrder);
        }
        else if (sortBy === 'id') {
            queryBuilder.orderBy('product.id', sortOrder);
        }
        else if (sortBy === 'title') {
            queryBuilder.orderBy('product.title', sortOrder);
        }
        else {
            queryBuilder.orderBy('product.id', sortOrder);
        }
        return queryBuilder;
    }
    async queueProductRefresh(id) {
        const jobId = `refresh-${id}-${Date.now()}`;
        console.log(`Queued product refresh for ID ${id}, job ID: ${jobId}`);
        return jobId;
    }
    async getSearchAnalytics(days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                days
            },
            totalSearches: Math.floor(Math.random() * 1000) + 100,
            topQueries: [
                { query: 'fiction', count: Math.floor(Math.random() * 50) + 10 },
                { query: 'mystery', count: Math.floor(Math.random() * 40) + 8 },
                { query: 'romance', count: Math.floor(Math.random() * 35) + 6 },
                { query: 'science fiction', count: Math.floor(Math.random() * 30) + 5 },
                { query: 'biography', count: Math.floor(Math.random() * 25) + 4 }
            ],
            searchTrends: Array.from({ length: days }, (_, i) => ({
                date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                searches: Math.floor(Math.random() * 50) + 10
            }))
        };
    }
    async createProduct(createProductDto) {
        const product = this.productRepository.create(createProductDto);
        return await this.productRepository.save(product);
    }
    async updateProduct(id, updateProductDto) {
        const product = await this.findOne(id);
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        Object.assign(product, updateProductDto);
        return await this.productRepository.save(product);
    }
    async deleteProduct(id) {
        const result = await this.productRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
    }
    async getProductById(id, includes = []) {
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.detail', 'detail')
            .leftJoinAndSelect('product.reviews', 'reviews')
            .where('product.id = :id', { id });
        return await queryBuilder.getOne();
    }
    async trackView(id) {
        console.log(`Tracked view for product ID: ${id}`);
    }
    async searchProducts(query, options = {}) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.detail', 'detail')
            .where('product.title ILIKE :query OR product.author ILIKE :query', {
            query: `%${query}%`
        })
            .skip(skip)
            .take(limit);
        const [products, total] = await queryBuilder.getManyAndCount();
        return new pagination_dto_1.PaginatedResponseDto(products, total, page, limit);
    }
    async getFacets(query) {
        return {
            categories: [
                { name: 'Fiction', count: 150 },
                { name: 'Non-Fiction', count: 120 },
                { name: 'Mystery', count: 80 },
                { name: 'Romance', count: 75 },
                { name: 'Science Fiction', count: 60 }
            ],
            priceRanges: [
                { range: '0-10', count: 200 },
                { range: '10-20', count: 180 },
                { range: '20-30', count: 120 },
                { range: '30+', count: 85 }
            ],
            authors: [
                { name: 'Stephen King', count: 15 },
                { name: 'Agatha Christie', count: 12 },
                { name: 'J.K. Rowling', count: 10 }
            ]
        };
    }
    async getSearchSuggestions(query, limit = 10) {
        const suggestions = [
            'fiction books',
            'mystery novels',
            'romance stories',
            'science fiction',
            'fantasy adventure',
            'historical fiction',
            'thriller books',
            'biography',
            'self help',
            'cooking books'
        ];
        return suggestions
            .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit);
    }
    async getPopularProducts(limit = 20, timeframe = 'week') {
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.detail', 'detail')
            .where('product.inStock = :inStock', { inStock: true })
            .orderBy('product.id', 'DESC')
            .limit(limit);
        return await queryBuilder.getMany();
    }
    async getRecommendations(productId, limit = 10) {
        const product = await this.findOne(productId);
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.detail', 'detail')
            .where('product.id != :productId', { productId })
            .andWhere('product.inStock = :inStock', { inStock: true });
        if (product.categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: product.categoryId });
        }
        return await queryBuilder
            .orderBy('product.id', 'DESC')
            .limit(limit)
            .getMany();
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_detail_entity_1.ProductDetail)),
    __param(2, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductService);
//# sourceMappingURL=product.service.js.map