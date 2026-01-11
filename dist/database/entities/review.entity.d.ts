import { Product } from './product.entity';
export declare class Review {
    id: number;
    productId: number;
    author: string;
    rating: number;
    text: string;
    reviewDate: Date;
    helpfulCount: number;
    createdAt: Date;
    updatedAt: Date;
    product: Product;
}
