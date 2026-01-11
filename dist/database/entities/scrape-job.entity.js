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
exports.ScrapeJob = exports.ScrapeJobType = exports.ScrapeJobStatus = void 0;
const typeorm_1 = require("typeorm");
var ScrapeJobStatus;
(function (ScrapeJobStatus) {
    ScrapeJobStatus["PENDING"] = "pending";
    ScrapeJobStatus["RUNNING"] = "running";
    ScrapeJobStatus["COMPLETED"] = "completed";
    ScrapeJobStatus["FAILED"] = "failed";
    ScrapeJobStatus["CANCELLED"] = "cancelled";
})(ScrapeJobStatus || (exports.ScrapeJobStatus = ScrapeJobStatus = {}));
var ScrapeJobType;
(function (ScrapeJobType) {
    ScrapeJobType["NAVIGATION"] = "navigation";
    ScrapeJobType["CATEGORY"] = "category";
    ScrapeJobType["PRODUCT_LIST"] = "product_list";
    ScrapeJobType["PRODUCT_DETAIL"] = "product_detail";
})(ScrapeJobType || (exports.ScrapeJobType = ScrapeJobType = {}));
let ScrapeJob = class ScrapeJob {
};
exports.ScrapeJob = ScrapeJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ScrapeJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_url', length: 500 }),
    __metadata("design:type", String)
], ScrapeJob.prototype, "targetUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'target_type',
        type: 'enum',
        enum: ScrapeJobType,
    }),
    __metadata("design:type", String)
], ScrapeJob.prototype, "targetType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ScrapeJobStatus,
        default: ScrapeJobStatus.PENDING,
    }),
    __metadata("design:type", String)
], ScrapeJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ScrapeJob.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'finished_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ScrapeJob.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_log', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ScrapeJob.prototype, "errorLog", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'items_scraped', default: 0 }),
    __metadata("design:type", Number)
], ScrapeJob.prototype, "itemsScraped", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', default: 0 }),
    __metadata("design:type", Number)
], ScrapeJob.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ScrapeJob.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ScrapeJob.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ScrapeJob.prototype, "updatedAt", void 0);
exports.ScrapeJob = ScrapeJob = __decorate([
    (0, typeorm_1.Entity)('scrape_job'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['targetType']),
    (0, typeorm_1.Index)(['startedAt'])
], ScrapeJob);
//# sourceMappingURL=scrape-job.entity.js.map