import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ScrapingService } from './scraping.service';
import {
  ScrapeJobDto,
  CreateScrapeJobDto,
  ScrapeNavigationDto,
  ScrapeCategoryDto,
  ScrapeProductListDto,
  ScrapeProductDetailDto,
  ScrapeStatsDto,
} from './dto/scraping.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@ApiTags('scraping')
@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Get all scrape jobs with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of scrape jobs',
    type: PaginatedResponseDto<ScrapeJobDto>,
  })
  async findAllJobs(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<ScrapeJobDto>> {
    return this.scrapingService.findAllJobs(paginationDto);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get scrape job by ID' })
  @ApiParam({ name: 'id', description: 'Scrape job ID' })
  @ApiResponse({
    status: 200,
    description: 'Scrape job details',
    type: ScrapeJobDto,
  })
  async findJobById(@Param('id', ParseIntPipe) id: number): Promise<ScrapeJobDto> {
    return this.scrapingService.findJobById(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get scraping statistics' })
  @ApiResponse({
    status: 200,
    description: 'Scraping statistics',
    type: ScrapeStatsDto,
  })
  async getStats(): Promise<ScrapeStatsDto> {
    return this.scrapingService.getStats();
  }

  @Post('jobs')
  @ApiOperation({ summary: 'Create new scrape job' })
  @ApiResponse({
    status: 201,
    description: 'Scrape job created successfully',
    type: ScrapeJobDto,
  })
  async createScrapeJob(@Body() createScrapeJobDto: CreateScrapeJobDto): Promise<ScrapeJobDto> {
    return this.scrapingService.createScrapeJob(createScrapeJobDto);
  }

  @Post('navigation')
  @ApiOperation({ summary: 'Trigger navigation scraping' })
  @ApiResponse({
    status: 201,
    description: 'Navigation scrape job created',
    type: ScrapeJobDto,
  })
  async scrapeNavigation(@Body() scrapeNavigationDto: ScrapeNavigationDto): Promise<ScrapeJobDto> {
    return this.scrapingService.triggerNavigationScrape(scrapeNavigationDto.baseUrl);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Trigger category scraping' })
  @ApiResponse({
    status: 201,
    description: 'Category scrape job created',
    type: ScrapeJobDto,
  })
  async scrapeCategory(@Body() scrapeCategoryDto: ScrapeCategoryDto): Promise<ScrapeJobDto> {
    return this.scrapingService.triggerCategoryScrape(
      scrapeCategoryDto.categoryUrl,
      scrapeCategoryDto.navigationId,
      scrapeCategoryDto.parentId,
    );
  }

  @Post('products')
  @ApiOperation({ summary: 'Trigger product list scraping' })
  @ApiResponse({
    status: 201,
    description: 'Product list scrape job created',
    type: ScrapeJobDto,
  })
  async scrapeProductList(@Body() scrapeProductListDto: ScrapeProductListDto): Promise<ScrapeJobDto> {
    return this.scrapingService.triggerProductListScrape(
      scrapeProductListDto.productListUrl,
      scrapeProductListDto.categoryId,
      scrapeProductListDto.maxPages,
    );
  }

  @Post('product-detail')
  @ApiOperation({ summary: 'Trigger product detail scraping' })
  @ApiResponse({
    status: 201,
    description: 'Product detail scrape job created',
    type: ScrapeJobDto,
  })
  async scrapeProductDetail(@Body() scrapeProductDetailDto: ScrapeProductDetailDto): Promise<ScrapeJobDto> {
    return this.scrapingService.triggerProductDetailScrape(
      scrapeProductDetailDto.productUrl,
      scrapeProductDetailDto.productId,
    );
  }
}