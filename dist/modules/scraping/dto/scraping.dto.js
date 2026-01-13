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
exports.ScrapeStatsDto = exports.ScrapeProductDetailDto = exports.ScrapeProductListDto = exports.ScrapeCategoryDto = exports.ScrapeNavigationDto = exports.CreateScrapeJobDto = exports.ScrapeJobDto = exports.ScrapeJobStatus = exports.ScrapeJobType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ScrapeJobType;
(function (ScrapeJobType) {
    ScrapeJobType["NAVIGATION"] = "navigation";
    ScrapeJobType["CATEGORY"] = "category";
    ScrapeJobType["PRODUCT_LIST"] = "product_list";
    ScrapeJobType["PRODUCT_DETAIL"] = "product_detail";
})(ScrapeJobType || (exports.ScrapeJobType = ScrapeJobType = {}));
var ScrapeJobStatus;
(function (ScrapeJobStatus) {
    ScrapeJobStatus["PENDING"] = "pending";
    ScrapeJobStatus["RUNNING"] = "running";
    ScrapeJobStatus["COMPLETED"] = "completed";
    ScrapeJobStatus["FAILED"] = "failed";
    ScrapeJobStatus["CANCELLED"] = "cancelled";
})(ScrapeJobStatus || (exports.ScrapeJobStatus = ScrapeJobStatus = {}));
class ScrapeJobDto {
}
exports.ScrapeJobDto = ScrapeJobDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scrape job ID' }),
    __metadata("design:type", Number)
], ScrapeJobDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target URL to scrape' }),
    __metadata("design:type", String)
], ScrapeJobDto.prototype, "targetUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of scraping job', enum: ScrapeJobType }),
    __metadata("design:type", String)
], ScrapeJobDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job status', enum: ScrapeJobStatus }),
    __metadata("design:type", String)
], ScrapeJobDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job start timestamp' }),
    __metadata("design:type", Date)
], ScrapeJobDto.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job completion timestamp' }),
    __metadata("design:type", Date)
], ScrapeJobDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Error message if failed' }),
    __metadata("design:type", String)
], ScrapeJobDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of items processed' }),
    __metadata("design:type", Number)
], ScrapeJobDto.prototype, "itemsProcessed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of retry attempts' }),
    __metadata("design:type", Number)
], ScrapeJobDto.prototype, "retryCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    __metadata("design:type", Object)
], ScrapeJobDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], ScrapeJobDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], ScrapeJobDto.prototype, "updatedAt", void 0);
class CreateScrapeJobDto {
}
exports.CreateScrapeJobDto = CreateScrapeJobDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target URL to scrape' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateScrapeJobDto.prototype, "targetUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of scraping job', enum: ScrapeJobType }),
    (0, class_validator_1.IsEnum)(ScrapeJobType),
    __metadata("design:type", String)
], CreateScrapeJobDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateScrapeJobDto.prototype, "metadata", void 0);
class ScrapeNavigationDto {
}
exports.ScrapeNavigationDto = ScrapeNavigationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Base URL to scrape navigation from' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ScrapeNavigationDto.prototype, "baseUrl", void 0);
class ScrapeCategoryDto {
}
exports.ScrapeCategoryDto = ScrapeCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category URL to scrape' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ScrapeCategoryDto.prototype, "categoryUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Navigation ID to associate with' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ScrapeCategoryDto.prototype, "navigationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent category ID' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ScrapeCategoryDto.prototype, "parentId", void 0);
class ScrapeProductListDto {
}
exports.ScrapeProductListDto = ScrapeProductListDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product list URL to scrape' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ScrapeProductListDto.prototype, "productListUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category ID to associate products with' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ScrapeProductListDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum number of pages to scrape' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ScrapeProductListDto.prototype, "maxPages", void 0);
class ScrapeProductDetailDto {
}
exports.ScrapeProductDetailDto = ScrapeProductDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product detail URL to scrape' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ScrapeProductDetailDto.prototype, "productUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product ID to update' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ScrapeProductDetailDto.prototype, "productId", void 0);
class ScrapeStatsDto {
}
exports.ScrapeStatsDto = ScrapeStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of scrape jobs' }),
    __metadata("design:type", Number)
], ScrapeStatsDto.prototype, "totalJobs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of pending jobs' }),
    __metadata("design:type", Number)
], ScrapeStatsDto.prototype, "pendingJobs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of running jobs' }),
    __metadata("design:type", Number)
], ScrapeStatsDto.prototype, "runningJobs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of completed jobs' }),
    __metadata("design:type", Number)
], ScrapeStatsDto.prototype, "completedJobs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of failed jobs' }),
    __metadata("design:type", Number)
], ScrapeStatsDto.prototype, "failedJobs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total items scraped' }),
    __metadata("design:type", Number)
], ScrapeStatsDto.prototype, "totalItemsScraped", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last scrape timestamp' }),
    __metadata("design:type", Date)
], ScrapeStatsDto.prototype, "lastScrapeAt", void 0);
//# sourceMappingURL=scraping.dto.js.map