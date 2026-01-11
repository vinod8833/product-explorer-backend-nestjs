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
exports.ProductQueryDto = exports.UpdateProductDto = exports.CreateProductDto = exports.ProductDetailDto = exports.ReviewDto = exports.ProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ProductDto {
}
exports.ProductDto = ProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product ID' }),
    __metadata("design:type", Number)
], ProductDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source ID from World of Books' }),
    __metadata("design:type", String)
], ProductDto.prototype, "sourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category ID' }),
    __metadata("design:type", Number)
], ProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product title' }),
    __metadata("design:type", String)
], ProductDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product author' }),
    __metadata("design:type", String)
], ProductDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product price' }),
    __metadata("design:type", Number)
], ProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency code' }),
    __metadata("design:type", String)
], ProductDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product image URL' }),
    __metadata("design:type", String)
], ProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source URL' }),
    __metadata("design:type", String)
], ProductDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'In stock status' }),
    __metadata("design:type", Boolean)
], ProductDto.prototype, "inStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last scraped timestamp' }),
    __metadata("design:type", Date)
], ProductDto.prototype, "lastScrapedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], ProductDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], ProductDto.prototype, "updatedAt", void 0);
class ReviewDto {
}
exports.ReviewDto = ReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Review ID' }),
    __metadata("design:type", Number)
], ReviewDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product ID' }),
    __metadata("design:type", Number)
], ReviewDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Review author' }),
    __metadata("design:type", String)
], ReviewDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Rating (1-5)' }),
    __metadata("design:type", Number)
], ReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Review text' }),
    __metadata("design:type", String)
], ReviewDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Review date' }),
    __metadata("design:type", Date)
], ReviewDto.prototype, "reviewDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Helpful count' }),
    __metadata("design:type", Number)
], ReviewDto.prototype, "helpfulCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], ReviewDto.prototype, "createdAt", void 0);
class ProductDetailDto extends ProductDto {
}
exports.ProductDetailDto = ProductDetailDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product description' }),
    __metadata("design:type", String)
], ProductDetailDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product specifications' }),
    __metadata("design:type", Object)
], ProductDetailDto.prototype, "specs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Average rating' }),
    __metadata("design:type", Number)
], ProductDetailDto.prototype, "ratingsAvg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of reviews' }),
    __metadata("design:type", Number)
], ProductDetailDto.prototype, "reviewsCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Publisher' }),
    __metadata("design:type", String)
], ProductDetailDto.prototype, "publisher", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Publication date' }),
    __metadata("design:type", Date)
], ProductDetailDto.prototype, "publicationDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISBN' }),
    __metadata("design:type", String)
], ProductDetailDto.prototype, "isbn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page count' }),
    __metadata("design:type", Number)
], ProductDetailDto.prototype, "pageCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Genres', type: [String] }),
    __metadata("design:type", Array)
], ProductDetailDto.prototype, "genres", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product reviews', type: [ReviewDto] }),
    __metadata("design:type", Array)
], ProductDetailDto.prototype, "reviews", void 0);
class CreateProductDto {
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source ID from World of Books' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product author' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product price' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency code' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product image URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source URL' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'In stock status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "inStock", void 0);
class UpdateProductDto {
}
exports.UpdateProductDto = UpdateProductDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product author' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product price' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product image URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'In stock status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "inStock", void 0);
class ProductQueryDto {
}
exports.ProductQueryDto = ProductQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search query' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category ID filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], ProductQueryDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Navigation slug filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "navigation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category slug filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum price filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProductQueryDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum price filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProductQueryDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Author filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'In stock filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProductQueryDto.prototype, "inStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort by field' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order (ASC/DESC)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Book conditions (comma-separated)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "conditions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Categories (comma-separated)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Publisher filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "publisher", void 0);
//# sourceMappingURL=product.dto.js.map