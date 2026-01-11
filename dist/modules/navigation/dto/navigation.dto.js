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
exports.UpdateNavigationDto = exports.CreateNavigationDto = exports.NavigationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class NavigationDto {
}
exports.NavigationDto = NavigationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Navigation ID' }),
    __metadata("design:type", Number)
], NavigationDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Navigation title' }),
    __metadata("design:type", String)
], NavigationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Navigation slug' }),
    __metadata("design:type", String)
], NavigationDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source URL' }),
    __metadata("design:type", String)
], NavigationDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last scraped timestamp' }),
    __metadata("design:type", Date)
], NavigationDto.prototype, "lastScrapedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], NavigationDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], NavigationDto.prototype, "updatedAt", void 0);
class CreateNavigationDto {
}
exports.CreateNavigationDto = CreateNavigationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Navigation title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNavigationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Navigation slug' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNavigationDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateNavigationDto.prototype, "sourceUrl", void 0);
class UpdateNavigationDto {
}
exports.UpdateNavigationDto = UpdateNavigationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Navigation title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateNavigationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateNavigationDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last scraped timestamp' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], UpdateNavigationDto.prototype, "lastScrapedAt", void 0);
//# sourceMappingURL=navigation.dto.js.map