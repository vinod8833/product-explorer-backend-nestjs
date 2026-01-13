export declare enum ScrapeJobStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum ScrapeJobType {
    NAVIGATION = "navigation",
    CATEGORY = "category",
    PRODUCT_LIST = "product_list",
    PRODUCT_DETAIL = "product_detail"
}
export declare class ScrapeJob {
    id: number;
    targetUrl: string;
    targetType: ScrapeJobType;
    status: ScrapeJobStatus;
    startedAt: Date;
    completedAt: Date;
    errorMessage: string;
    itemsProcessed: number;
    itemsCreated: number;
    itemsUpdated: number;
    retryCount: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
