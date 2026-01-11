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
exports.CategoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const category_service_1 = require("./category.service");
const category_dto_1 = require("./dto/category.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let CategoryController = class CategoryController {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async findAll(paginationDto) {
        return this.categoryService.findAll(paginationDto);
    }
    async findByNavigation(navigationId, paginationDto) {
        return this.categoryService.findByNavigation(navigationId, paginationDto);
    }
    async findOne(id) {
        return this.categoryService.findOne(id);
    }
    async findBySlug(slug) {
        return this.categoryService.findBySlug(slug);
    }
    async create(createCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }
    async update(id, updateCategoryDto) {
        return this.categoryService.update(id, updateCategoryDto);
    }
    async remove(id) {
        return this.categoryService.remove(id);
    }
};
exports.CategoryController = CategoryController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all categories with pagination' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of categories',
        type: (pagination_dto_1.PaginatedResponseDto),
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('navigation/:navigationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get categories by navigation ID' }),
    (0, swagger_1.ApiParam)({ name: 'navigationId', description: 'Navigation ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of categories for navigation',
        type: (pagination_dto_1.PaginatedResponseDto),
    }),
    __param(0, (0, common_1.Param)('navigationId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findByNavigation", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Category details',
        type: category_dto_1.CategoryDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category by slug' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Category slug' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Category details',
        type: category_dto_1.CategoryDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new category' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Category created successfully',
        type: category_dto_1.CategoryDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update category' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Category updated successfully',
        type: category_dto_1.CategoryDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, category_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete category' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "remove", null);
exports.CategoryController = CategoryController = __decorate([
    (0, swagger_1.ApiTags)('categories'),
    (0, common_1.Controller)('categories'),
    __metadata("design:paramtypes", [category_service_1.CategoryService])
], CategoryController);
//# sourceMappingURL=category.controller.js.map