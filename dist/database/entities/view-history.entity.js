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
exports.ViewHistory = void 0;
const typeorm_1 = require("typeorm");
let ViewHistory = class ViewHistory {
};
exports.ViewHistory = ViewHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ViewHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', nullable: true }),
    __metadata("design:type", String)
], ViewHistory.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], ViewHistory.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id' }),
    __metadata("design:type", String)
], ViewHistory.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_type' }),
    __metadata("design:type", String)
], ViewHistory.prototype, "itemType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ViewHistory.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ViewHistory.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ViewHistory.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', nullable: true }),
    __metadata("design:type", String)
], ViewHistory.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', nullable: true }),
    __metadata("design:type", String)
], ViewHistory.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ViewHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ViewHistory.prototype, "updatedAt", void 0);
exports.ViewHistory = ViewHistory = __decorate([
    (0, typeorm_1.Entity)('view_history'),
    (0, typeorm_1.Index)(['sessionId', 'createdAt']),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['itemType', 'createdAt'])
], ViewHistory);
//# sourceMappingURL=view-history.entity.js.map