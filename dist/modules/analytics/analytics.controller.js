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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async recordView(data, sessionId, userAgent, ipAddress) {
        const viewData = {
            ...data,
            sessionId: sessionId || data.sessionId,
            userAgent,
            ipAddress,
        };
        const result = await this.analyticsService.recordView(viewData);
        return {
            success: true,
            data: result,
        };
    }
    async getViewHistory(sessionId, userId, limit, offset, itemType) {
        const options = {
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            itemType,
        };
        const result = await this.analyticsService.getViewHistory(sessionId, userId, options);
        return {
            success: true,
            ...result,
        };
    }
    async getPopularItems(itemType = 'product', limit, timeframe) {
        const options = {
            limit: limit ? parseInt(limit) : undefined,
            timeframe,
        };
        const result = await this.analyticsService.getPopularItems(itemType, options);
        return {
            success: true,
            data: result,
        };
    }
    async getUserRecommendations(sessionId, userId, limit) {
        const options = {
            limit: limit ? parseInt(limit) : undefined,
        };
        const result = await this.analyticsService.getUserRecommendations(sessionId, userId, options);
        return {
            success: true,
            data: result,
        };
    }
    async getViewStats(timeframe) {
        const result = await this.analyticsService.getViewStats({ timeframe });
        return {
            success: true,
            data: result,
        };
    }
    async clearViewHistory(sessionId, userId) {
        await this.analyticsService.clearViewHistory(sessionId, userId);
        return {
            success: true,
            message: 'View history cleared successfully',
        };
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('view'),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Headers)('x-session-id')),
    __param(2, (0, common_1.Headers)('user-agent')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "recordView", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, common_1.Query)('itemType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getViewHistory", null);
__decorate([
    (0, common_1.Get)('popular'),
    __param(0, (0, common_1.Query)('itemType')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPopularItems", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserRecommendations", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getViewStats", null);
__decorate([
    (0, common_1.Delete)('history'),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "clearViewHistory", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map