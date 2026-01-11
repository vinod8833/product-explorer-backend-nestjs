import { AnalyticsService, CreateViewHistoryDto } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    recordView(data: CreateViewHistoryDto, sessionId?: string, userAgent?: string, ipAddress?: string): Promise<{
        success: boolean;
        data: import("../../database/entities/view-history.entity").ViewHistory;
    }>;
    getViewHistory(sessionId?: string, userId?: string, limit?: string, offset?: string, itemType?: 'product' | 'category' | 'search'): Promise<{
        data: import("../../database/entities/view-history.entity").ViewHistory[];
        total: number;
        success: boolean;
    }>;
    getPopularItems(itemType?: 'product' | 'category' | 'search', limit?: string, timeframe?: 'day' | 'week' | 'month'): Promise<{
        success: boolean;
        data: {
            itemId: string;
            title: string;
            viewCount: number;
            metadata?: any;
        }[];
    }>;
    getUserRecommendations(sessionId?: string, userId?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            itemId: string;
            title: string;
            score: number;
            metadata?: any;
        }[];
    }>;
    getViewStats(timeframe?: 'day' | 'week' | 'month'): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    clearViewHistory(sessionId?: string, userId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
