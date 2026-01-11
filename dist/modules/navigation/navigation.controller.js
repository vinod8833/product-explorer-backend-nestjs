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
exports.NavigationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const navigation_service_1 = require("./navigation.service");
const navigation_dto_1 = require("./dto/navigation.dto");
let NavigationController = class NavigationController {
    constructor(navigationService) {
        this.navigationService = navigationService;
    }
    async findAll() {
        return this.navigationService.findAll();
    }
    async findOne(id) {
        return this.navigationService.findOne(id);
    }
    async findBySlug(slug) {
        return this.navigationService.findBySlug(slug);
    }
    async create(createNavigationDto) {
        return this.navigationService.create(createNavigationDto);
    }
    async update(id, updateNavigationDto) {
        return this.navigationService.update(id, updateNavigationDto);
    }
    async remove(id) {
        return this.navigationService.remove(id);
    }
};
exports.NavigationController = NavigationController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all navigation items' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of navigation items',
        type: [navigation_dto_1.NavigationDto],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NavigationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get navigation item by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Navigation ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Navigation item details',
        type: navigation_dto_1.NavigationDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Navigation item not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NavigationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get navigation item by slug' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Navigation slug' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Navigation item details',
        type: navigation_dto_1.NavigationDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Navigation item not found' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NavigationController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new navigation item' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Navigation item created successfully',
        type: navigation_dto_1.NavigationDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [navigation_dto_1.CreateNavigationDto]),
    __metadata("design:returntype", Promise)
], NavigationController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update navigation item' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Navigation ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Navigation item updated successfully',
        type: navigation_dto_1.NavigationDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Navigation item not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, navigation_dto_1.UpdateNavigationDto]),
    __metadata("design:returntype", Promise)
], NavigationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete navigation item' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Navigation ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Navigation item deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Navigation item not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NavigationController.prototype, "remove", null);
exports.NavigationController = NavigationController = __decorate([
    (0, swagger_1.ApiTags)('navigation'),
    (0, common_1.Controller)('navigation'),
    __metadata("design:paramtypes", [navigation_service_1.NavigationService])
], NavigationController);
//# sourceMappingURL=navigation.controller.js.map