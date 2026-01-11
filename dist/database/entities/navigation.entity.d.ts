import { Category } from './category.entity';
export declare class Navigation {
    id: number;
    title: string;
    slug: string;
    sourceUrl: string;
    lastScrapedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    categories: Category[];
}
