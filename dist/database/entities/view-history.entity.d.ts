export declare class ViewHistory {
    id: number;
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
    createdAt: Date;
    updatedAt: Date;
}
