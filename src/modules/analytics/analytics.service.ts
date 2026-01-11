import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViewHistory } from '../../database/entities/view-history.entity';

export interface CreateViewHistoryDto {
  sessionId?: string;
  userId?: string;
  itemId: string;
  itemType: 'product' | 'category' | 'search';
  title: string;
  url: string;
  metadata?: {
    author?: string;
    price?: number;
    imageUrl?: string;
    category?: string;
    searchQuery?: string;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ViewHistory)
    private viewHistoryRepository: Repository<ViewHistory>,
  ) {}

  async recordView(data: CreateViewHistoryDto): Promise<ViewHistory> {
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

  async getViewHistory(
    sessionId?: string,
    userId?: string,
    options: {
      limit?: number;
      offset?: number;
      itemType?: 'product' | 'category' | 'search';
    } = {},
  ): Promise<{ data: ViewHistory[]; total: number }> {
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

  async getPopularItems(
    itemType: 'product' | 'category' | 'search',
    options: {
      limit?: number;
      timeframe?: 'day' | 'week' | 'month';
    } = {},
  ): Promise<Array<{ itemId: string; title: string; viewCount: number; metadata?: any }>> {
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

  async getUserRecommendations(
    sessionId?: string,
    userId?: string,
    options: {
      limit?: number;
    } = {},
  ): Promise<Array<{ itemId: string; title: string; score: number; metadata?: any }>> {
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

  async clearViewHistory(sessionId?: string, userId?: string): Promise<void> {
    const queryBuilder = this.viewHistoryRepository.createQueryBuilder()
      .delete()
      .from(ViewHistory);

    if (sessionId) {
      queryBuilder.andWhere('sessionId = :sessionId', { sessionId });
    }

    if (userId) {
      queryBuilder.andWhere('userId = :userId', { userId });
    }

    await queryBuilder.execute();
  }

  async getViewStats(
    options: {
      timeframe?: 'day' | 'week' | 'month';
    } = {},
  ): Promise<{
    totalViews: number;
    uniqueItems: number;
    topCategories: Array<{ category: string; count: number }>;
    viewsByType: Array<{ itemType: string; count: number }>;
  }> {
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
      this.viewHistoryRepository.query(
        `SELECT COUNT(*) as count FROM view_history WHERE ${timeCondition}`,
      ),
      
      this.viewHistoryRepository.query(
        `SELECT COUNT(DISTINCT item_id) as count FROM view_history WHERE ${timeCondition}`,
      ),
      
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
}