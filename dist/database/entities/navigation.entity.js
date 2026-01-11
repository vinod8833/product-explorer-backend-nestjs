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
exports.Navigation = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
let Navigation = class Navigation {
};
exports.Navigation = Navigation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Navigation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Navigation.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, unique: true }),
    __metadata("design:type", String)
], Navigation.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], Navigation.prototype, "sourceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_scraped_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Navigation.prototype, "lastScrapedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Navigation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Navigation.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => category_entity_1.Category, (category) => category.navigation),
    __metadata("design:type", Array)
], Navigation.prototype, "categories", void 0);
exports.Navigation = Navigation = __decorate([
    (0, typeorm_1.Entity)('navigation'),
    (0, typeorm_1.Index)(['slug'], { unique: true })
], Navigation);
//# sourceMappingURL=navigation.entity.js.map