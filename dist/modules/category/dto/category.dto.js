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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCategoryDto = exports.CreateCategoryDto = exports.CategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CategoryDto {
}
exports.CategoryDto = CategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category ID' }),
    __metadata("design:type", Number)
], CategoryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Navigation ID' }),
    __metadata("design:type", Number)
], CategoryDto.prototype, "navigationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent category ID' }),
    __metadata("design:type", Number)
], CategoryDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category title' }),
    __metadata("design:type", String)
], CategoryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category slug' }),
    __metadata("design:type", String)
], CategoryDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source URL' }),
    __metadata("design:type", String)
], CategoryDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product count' }),
    __metadata("design:type", Number)
], CategoryDto.prototype, "productCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last scraped timestamp' }),
    __metadata("design:type", Date)
], CategoryDto.prototype, "lastScrapedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], CategoryDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], CategoryDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Child categories', type: [CategoryDto] }),
    __metadata("design:type", Array)
], CategoryDto.prototype, "children", void 0);
class CreateCategoryDto {
}
exports.CreateCategoryDto = CreateCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Navigation ID' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "navigationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent category ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category slug' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product count' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "productCount", void 0);
class UpdateCategoryDto {
}
exports.UpdateCategoryDto = UpdateCategoryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product count' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCategoryDto.prototype, "productCount", void 0);
//# sourceMappingURL=category.dto.js.map