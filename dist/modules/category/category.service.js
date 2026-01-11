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
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("../../database/entities/category.entity");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let CategoryService = class CategoryService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async findAll(paginationDto) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const [categories, total] = await this.categoryRepository.findAndCount({
            skip,
            take: limit,
            order: { title: 'ASC' },
            relations: ['navigation', 'parent'],
        });
        return new pagination_dto_1.PaginatedResponseDto(categories, total, page, limit);
    }
    async findByNavigation(navigationId, paginationDto) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const [categories, total] = await this.categoryRepository.findAndCount({
            where: { navigationId, parentId: null },
            skip,
            take: limit,
            order: { title: 'ASC' },
            relations: ['children'],
        });
        return new pagination_dto_1.PaginatedResponseDto(categories, total, page, limit);
    }
    async findOne(id) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['navigation', 'parent', 'children', 'products'],
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }
    async findBySlug(slug) {
        const category = await this.categoryRepository.findOne({
            where: { slug },
            relations: ['navigation', 'parent', 'children', 'products'],
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with slug ${slug} not found`);
        }
        return category;
    }
    async create(createCategoryDto) {
        const category = this.categoryRepository.create(createCategoryDto);
        return this.categoryRepository.save(category);
    }
    async update(id, updateCategoryDto) {
        const category = await this.findOne(id);
        Object.assign(category, updateCategoryDto);
        return this.categoryRepository.save(category);
    }
    async remove(id) {
        const category = await this.findOne(id);
        await this.categoryRepository.remove(category);
    }
    async upsertBySlug(slug, data) {
        const existing = await this.categoryRepository.findOne({ where: { slug } });
        if (existing) {
            Object.assign(existing, data, { lastScrapedAt: new Date() });
            return this.categoryRepository.save(existing);
        }
        const category = this.categoryRepository.create({
            ...data,
            slug,
            lastScrapedAt: new Date(),
        });
        return this.categoryRepository.save(category);
    }
    async updateProductCount(categoryId) {
        const result = await this.categoryRepository
            .createQueryBuilder('category')
            .leftJoin('category.products', 'product')
            .select('COUNT(product.id)', 'count')
            .where('category.id = :categoryId', { categoryId })
            .getRawOne();
        await this.categoryRepository.update(categoryId, {
            productCount: parseInt(result.count, 10),
        });
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoryService);
//# sourceMappingURL=category.service.js.map