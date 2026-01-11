export declare class CategoryDto {
    id: number;
    navigationId: number;
    parentId?: number;
    title: string;
    slug: string;
    sourceUrl?: string;
    productCount: number;
    lastScrapedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    children?: CategoryDto[];
}
export declare class CreateCategoryDto {
    navigationId: number;
    parentId?: number;
    title: string;
    slug: string;
    sourceUrl?: string;
    productCount?: number;
}
export declare class UpdateCategoryDto {
    title?: string;
    sourceUrl?: string;
    productCount?: number;
}
