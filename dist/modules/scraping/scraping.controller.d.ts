import { ScrapingService } from './scraping.service';
import { WorldOfBooksScraperService } from './world-of-books-scraper.service';
import { StartupScrapingService } from './startup-scraping.service';
import { ScrapeJobDto, CreateScrapeJobDto, ScrapeNavigationDto, ScrapeCategoryDto, ScrapeProductListDto, ScrapeProductDetailDto, ScrapeStatsDto } from './dto/scraping.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
export declare class ScrapingController {
    private readonly scrapingService;
    private readonly scraperService;
    private readonly startupScrapingService;
    constructor(scrapingService: ScrapingService, scraperService: WorldOfBooksScraperService, startupScrapingService: StartupScrapingService);
    findAllJobs(paginationDto: PaginationDto): Promise<PaginatedResponseDto<ScrapeJobDto>>;
    findJobById(id: number): Promise<ScrapeJobDto>;
    getStats(): Promise<ScrapeStatsDto>;
    createScrapeJob(createScrapeJobDto: CreateScrapeJobDto): Promise<ScrapeJobDto>;
    scrapeNavigation(scrapeNavigationDto: ScrapeNavigationDto): Promise<ScrapeJobDto>;
    scrapeCategory(scrapeCategoryDto: ScrapeCategoryDto): Promise<ScrapeJobDto>;
    scrapeProductList(scrapeProductListDto: ScrapeProductListDto): Promise<ScrapeJobDto>;
    scrapeProductDetail(scrapeProductDetailDto: ScrapeProductDetailDto): Promise<ScrapeJobDto>;
    scrapeNavigationLive(): Promise<{
        success: boolean;
        count: number;
        data: import("./world-of-books-scraper.service").NavigationItem[];
        timestamp: string;
    }>;
    scrapeCategoriesLive(url: string, maxDepth?: string): Promise<{
        success: boolean;
        count: number;
        data: import("./world-of-books-scraper.service").CategoryItem[];
        sourceUrl: string;
        maxDepth: number;
        timestamp: string;
    }>;
    scrapeProductsLive(url: string, maxPages?: string): Promise<{
        success: boolean;
        count: number;
        data: import("./world-of-books-scraper.service").ProductItem[];
        sourceUrl: string;
        maxPages: number;
        timestamp: string;
    }>;
    scrapeProductDetailLive(url: string): Promise<{
        success: boolean;
        data: import("./world-of-books-scraper.service").ProductDetailItem;
        sourceUrl: string;
        timestamp: string;
    }>;
    scrapeAndSave(body: {
        includeNavigation?: boolean;
        includeCategories?: boolean;
        includeProducts?: boolean;
        maxPages?: number;
        maxDepth?: number;
    }): Promise<{
        success: boolean;
        message: string;
        results: {
            navigation: {
                count: number;
                data: any[];
            };
            categories: {
                count: number;
                data: any[];
            };
            products: {
                count: number;
                data: any[];
            };
        };
        timestamp: string;
    }>;
    updateMissingImages(): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    verifyImageUrl(url: string): Promise<{
        success: boolean;
        url: string;
        isValid: boolean;
        message: string;
        timestamp: string;
    }>;
}
