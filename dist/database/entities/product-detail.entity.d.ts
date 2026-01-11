import { Product } from './product.entity';
export declare class ProductDetail {
    id: number;
    productId: number;
    description: string;
    specs: Record<string, any>;
    ratingsAvg: number;
    reviewsCount: number;
    publisher: string;
    publicationDate: Date;
    isbn: string;
    pageCount: number;
    genres: string[];
    createdAt: Date;
    updatedAt: Date;
    product: Product;
}
