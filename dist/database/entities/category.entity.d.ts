import { Navigation } from './navigation.entity';
import { Product } from './product.entity';
export declare class Category {
    id: number;
    navigationId: number;
    parentId: number;
    title: string;
    slug: string;
    sourceUrl: string;
    productCount: number;
    lastScrapedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    navigation: Navigation;
    parent: Category;
    children: Category[];
    products: Product[];
}
