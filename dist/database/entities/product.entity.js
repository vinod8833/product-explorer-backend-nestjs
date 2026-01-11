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
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const product_detail_entity_1 = require("./product-detail.entity");
const review_entity_1 = require("./review.entity");
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_id', length: 255, unique: true }),
    __metadata("design:type", String)
], Product.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Product.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'GBP' }),
    __metadata("design:type", String)
], Product.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_url', length: 500 }),
    __metadata("design:type", String)
], Product.prototype, "sourceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'in_stock', default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "inStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_scraped_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Product.prototype, "lastScrapedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, (category) => category.products),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => product_detail_entity_1.ProductDetail, (detail) => detail.product),
    __metadata("design:type", product_detail_entity_1.ProductDetail)
], Product.prototype, "detail", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => review_entity_1.Review, (review) => review.product),
    __metadata("design:type", Array)
], Product.prototype, "reviews", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('product'),
    (0, typeorm_1.Index)(['sourceId'], { unique: true }),
    (0, typeorm_1.Index)(['categoryId']),
    (0, typeorm_1.Index)(['lastScrapedAt'])
], Product);
//# sourceMappingURL=product.entity.js.map