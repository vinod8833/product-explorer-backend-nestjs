import { ScrapingService } from './scraping.service';
import { ScrapeJobDto, CreateScrapeJobDto, ScrapeNavigationDto, ScrapeCategoryDto, ScrapeProductListDto, ScrapeProductDetailDto, ScrapeStatsDto } from './dto/scraping.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
export declare class ScrapingController {
    private readonly scrapingService;
    constructor(scrapingService: ScrapingService);
    findAllJobs(paginationDto: PaginationDto): Promise<PaginatedResponseDto<ScrapeJobDto>>;
    findJobById(id: number): Promise<ScrapeJobDto>;
    getStats(): Promise<ScrapeStatsDto>;
    createScrapeJob(createScrapeJobDto: CreateScrapeJobDto): Promise<ScrapeJobDto>;
    scrapeNavigation(scrapeNavigationDto: ScrapeNavigationDto): Promise<ScrapeJobDto>;
    scrapeCategory(scrapeCategoryDto: ScrapeCategoryDto): Promise<ScrapeJobDto>;
    scrapeProductList(scrapeProductListDto: ScrapeProductListDto): Promise<ScrapeJobDto>;
    scrapeProductDetail(scrapeProductDetailDto: ScrapeProductDetailDto): Promise<ScrapeJobDto>;
}
