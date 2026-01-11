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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const view_history_entity_1 = require("../../database/entities/view-history.entity");
let AnalyticsService = class AnalyticsService {
    constructor(viewHistoryRepository) {
        this.viewHistoryRepository = viewHistoryRepository;
    }
    async recordView(data) {
        const recentView = await this.viewHistoryRepository.findOne({
            where: {
                sessionId: data.sessionId,
                itemId: data.itemId,
                itemType: data.itemType,
            },
            order: { createdAt: 'DESC' },
        });
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (recentView && recentView.createdAt > fiveMinutesAgo) {
            recentView.updatedAt = new Date();
            return this.viewHistoryRepository.save(recentView);
        }
        const viewHistory = this.viewHistoryRepository.create(data);
        return this.viewHistoryRepository.save(viewHistory);
    }
    async getViewHistory(sessionId, userId, options = {}) {
        const { limit = 50, offset = 0, itemType } = options;
        const queryBuilder = this.viewHistoryRepository
            .createQueryBuilder('vh')
            .orderBy('vh.createdAt', 'DESC');
        if (sessionId) {
            queryBuilder.andWhere('vh.sessionId = :sessionId', { sessionId });
        }
        if (userId) {
            queryBuilder.andWhere('vh.userId = :userId', { userId });
        }
        if (itemType) {
            queryBuilder.andWhere('vh.itemType = :itemType', { itemType });
        }
        const [data, total] = await queryBuilder
            .limit(limit)
            .offset(offset)
            .getManyAndCount();
        return { data, total };
    }
    async getPopularItems(itemType, options = {}) {
        const { limit = 10, timeframe = 'week' } = options;
        let timeCondition = '';
        switch (timeframe) {
            case 'day':
                timeCondition = "vh.created_at >= NOW() - INTERVAL '1 day'";
                break;
            case 'week':
                timeCondition = "vh.created_at >= NOW() - INTERVAL '1 week'";
                break;
            case 'month':
                timeCondition = "vh.created_at >= NOW() - INTERVAL '1 month'";
                break;
        }
        const query = `
      SELECT 
        vh.item_id as "itemId",
        vh.title,
        COUNT(*) as "viewCount",
        vh.metadata
      FROM view_history vh
      WHERE vh.item_type = $1
        AND ${timeCondition}
      GROUP BY vh.item_id, vh.title, vh.metadata
      ORDER BY "viewCount" DESC
      LIMIT $2
    `;
        return this.viewHistoryRepository.query(query, [itemType, limit]);
    }
    async getUserRecommendations(sessionId, userId, options = {}) {
        const { limit = 10 } = options;
        const query = `
      WITH user_views AS (
        SELECT DISTINCT vh.item_id, vh.metadata->>'category' as category
        FROM view_history vh
        WHERE (vh.session_id = $1 OR vh.user_id = $2)
          AND vh.item_type = 'product'
          AND vh.created_at >= NOW() - INTERVAL '30 days'
      ),
      category_popularity AS (
        SELECT 
          vh.item_id as "itemId",
          vh.title,
          vh.metadata,
          COUNT(*) as view_count,
          CASE 
            WHEN vh.metadata->>'category' IN (SELECT category FROM user_views) THEN 2.0
            ELSE 1.0
          END as category_boost
        FROM view_history vh
        WHERE vh.item_type = 'product'
          AND vh.created_at >= NOW() - INTERVAL '7 days'
          AND vh.item_id NOT IN (SELECT item_id FROM user_views)
        GROUP BY vh.item_id, vh.title, vh.metadata
      )
      SELECT 
        "itemId",
        title,
        (view_count * category_boost) as score,
        metadata
      FROM category_popularity
      ORDER BY score DESC
      LIMIT $3
    `;
        return this.viewHistoryRepository.query(query, [sessionId, userId, limit]);
    }
    async clearViewHistory(sessionId, userId) {
        const queryBuilder = this.viewHistoryRepository.createQueryBuilder()
            .delete()
            .from(view_history_entity_1.ViewHistory);
        if (sessionId) {
            queryBuilder.andWhere('sessionId = :sessionId', { sessionId });
        }
        if (userId) {
            queryBuilder.andWhere('userId = :userId', { userId });
        }
        await queryBuilder.execute();
    }
    async getViewStats(options = {}) {
        const { timeframe = 'week' } = options;
        let timeCondition = '';
        switch (timeframe) {
            case 'day':
                timeCondition = "created_at >= NOW() - INTERVAL '1 day'";
                break;
            case 'week':
                timeCondition = "created_at >= NOW() - INTERVAL '1 week'";
                break;
            case 'month':
                timeCondition = "created_at >= NOW() - INTERVAL '1 month'";
                break;
        }
        const [totalViews, uniqueItems, topCategories, viewsByType] = await Promise.all([
            this.viewHistoryRepository.query(`SELECT COUNT(*) as count FROM view_history WHERE ${timeCondition}`),
            this.viewHistoryRepository.query(`SELECT COUNT(DISTINCT item_id) as count FROM view_history WHERE ${timeCondition}`),
            this.viewHistoryRepository.query(`
        SELECT 
          metadata->>'category' as category,
          COUNT(*) as count
        FROM view_history 
        WHERE ${timeCondition}
          AND metadata->>'category' IS NOT NULL
        GROUP BY metadata->>'category'
        ORDER BY count DESC
        LIMIT 10
      `),
            this.viewHistoryRepository.query(`
        SELECT 
          item_type as "itemType",
          COUNT(*) as count
        FROM view_history 
        WHERE ${timeCondition}
        GROUP BY item_type
        ORDER BY count DESC
      `),
        ]);
        return {
            totalViews: parseInt(totalViews[0]?.count || '0'),
            uniqueItems: parseInt(uniqueItems[0]?.count || '0'),
            topCategories: topCategories || [],
            viewsByType: viewsByType || [],
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(view_history_entity_1.ViewHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map