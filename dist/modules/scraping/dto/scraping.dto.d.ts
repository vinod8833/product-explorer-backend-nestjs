export declare enum ScrapeJobType {
    NAVIGATION = "navigation",
    CATEGORY = "category",
    PRODUCT_LIST = "product_list",
    PRODUCT_DETAIL = "product_detail"
}
export declare enum ScrapeJobStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare class ScrapeJobDto {
    id: number;
    targetUrl: string;
    targetType: ScrapeJobType;
    status: ScrapeJobStatus;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
    itemsProcessed: number;
    retryCount: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreateScrapeJobDto {
    targetUrl: string;
    targetType: ScrapeJobType;
    metadata?: Record<string, any>;
}
export declare class ScrapeNavigationDto {
    baseUrl: string;
}
export declare class ScrapeCategoryDto {
    categoryUrl: string;
    navigationId?: number;
    parentId?: number;
}
export declare class ScrapeProductListDto {
    productListUrl: string;
    categoryId?: number;
    maxPages?: number;
}
export declare class ScrapeProductDetailDto {
    productUrl: string;
    productId?: number;
}
export declare class ScrapeStatsDto {
    totalJobs: number;
    pendingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalItemsScraped: number;
    lastScrapeAt?: Date;
}
