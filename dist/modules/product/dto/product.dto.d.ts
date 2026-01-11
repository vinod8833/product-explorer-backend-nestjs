export declare class ProductDto {
    id: number;
    sourceId: string;
    categoryId?: number;
    title: string;
    author?: string;
    price?: number;
    currency: string;
    imageUrl?: string;
    sourceUrl: string;
    inStock: boolean;
    lastScrapedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ReviewDto {
    id: number;
    productId: number;
    author?: string;
    rating?: number;
    text?: string;
    reviewDate?: Date;
    helpfulCount: number;
    createdAt: Date;
}
export declare class ProductDetailDto extends ProductDto {
    description?: string;
    specs?: Record<string, any>;
    ratingsAvg?: number;
    reviewsCount?: number;
    publisher?: string;
    publicationDate?: Date;
    isbn?: string;
    pageCount?: number;
    genres?: string[];
    reviews?: ReviewDto[];
}
export declare class CreateProductDto {
    sourceId: string;
    categoryId?: number;
    title: string;
    author?: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
    sourceUrl: string;
    inStock?: boolean;
}
export declare class UpdateProductDto {
    title?: string;
    author?: string;
    price?: number;
    imageUrl?: string;
    inStock?: boolean;
}
export declare class ProductQueryDto {
    q?: string;
    categoryId?: number;
    navigation?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    author?: string;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    conditions?: string;
    categories?: string;
    publisher?: string;
}
