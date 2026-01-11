export declare class NavigationDto {
    id: number;
    title: string;
    slug: string;
    sourceUrl?: string;
    lastScrapedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreateNavigationDto {
    title: string;
    slug: string;
    sourceUrl?: string;
}
export declare class UpdateNavigationDto {
    title?: string;
    sourceUrl?: string;
    lastScrapedAt?: Date;
}
