import { Category } from './category.entity';
import { ProductDetail } from './product-detail.entity';
import { Review } from './review.entity';
export declare class Product {
    id: number;
    sourceId: string;
    categoryId: number;
    title: string;
    author: string;
    price: number;
    currency: string;
    imageUrl: string;
    sourceUrl: string;
    inStock: boolean;
    lastScrapedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    category: Category;
    detail: ProductDetail;
    reviews: Review[];
}
