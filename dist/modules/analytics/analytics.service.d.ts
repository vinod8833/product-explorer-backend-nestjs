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
export declare class AnalyticsService {
    private viewHistoryRepository;
    constructor(viewHistoryRepository: Repository<ViewHistory>);
    recordView(data: CreateViewHistoryDto): Promise<ViewHistory>;
    getViewHistory(sessionId?: string, userId?: string, options?: {
        limit?: number;
        offset?: number;
        itemType?: 'product' | 'category' | 'search';
    }): Promise<{
        data: ViewHistory[];
        total: number;
    }>;
    getPopularItems(itemType: 'product' | 'category' | 'search', options?: {
        limit?: number;
        timeframe?: 'day' | 'week' | 'month';
    }): Promise<Array<{
        itemId: string;
        title: string;
        viewCount: number;
        metadata?: any;
    }>>;
    getUserRecommendations(sessionId?: string, userId?: string, options?: {
        limit?: number;
    }): Promise<Array<{
        itemId: string;
        title: string;
        score: number;
        metadata?: any;
    }>>;
    clearViewHistory(sessionId?: string, userId?: string): Promise<void>;
    getViewStats(options?: {
        timeframe?: 'day' | 'week' | 'month';
    }): Promise<{
        totalViews: number;
        uniqueItems: number;
        topCategories: Array<{
            category: string;
            count: number;
        }>;
        viewsByType: Array<{
            itemType: string;
            count: number;
        }>;
    }>;
}
