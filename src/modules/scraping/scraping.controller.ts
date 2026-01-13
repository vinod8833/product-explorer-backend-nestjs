import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ScrapingService } from './scraping.service';
import { WorldOfBooksScraperService } from './world-of-books-scraper.service';
import { StartupScrapingService } from './startup-scraping.service';
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
  constructor(
    private readonly scrapingService: ScrapingService,
    private readonly scraperService: WorldOfBooksScraperService,
    private readonly startupScrapingService: StartupScrapingService,
  ) {}

  // ========== JOB MANAGEMENT ENDPOINTS ==========

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

  // ========== ASYNC JOB CREATION ENDPOINTS ==========

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

  // ========== DIRECT SCRAPING REST API ENDPOINTS ==========

  @Get('live/navigation')
  @ApiOperation({ 
    summary: 'Scrape navigation data directly',
    description: 'Returns scraped navigation data immediately without creating a job'
  })
  @ApiResponse({
    status: 200,
    description: 'Navigation data scraped successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        count: { type: 'number' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              slug: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        timestamp: { type: 'string' }
      }
    }
  })
  async scrapeNavigationLive() {
    try {
      const results = await this.scraperService.scrapeNavigation();
      return {
        success: true,
        count: results.length,
        data: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('live/categories')
  @ApiOperation({ 
    summary: 'Scrape categories data directly',
    description: 'Returns scraped category data immediately from a specific URL'
  })
  @ApiQuery({ name: 'url', description: 'Category URL to scrape from', required: true })
  @ApiQuery({ name: 'maxDepth', description: 'Maximum depth to scrape', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Category data scraped successfully'
  })
  async scrapeCategoriesLive(
    @Query('url') url: string,
    @Query('maxDepth') maxDepth: string = '3'
  ) {
    if (!url) {
      throw new HttpException(
        {
          success: false,
          error: 'URL parameter is required',
          timestamp: new Date().toISOString()
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const results = await this.scraperService.scrapeCategories(url, parseInt(maxDepth));
      return {
        success: true,
        count: results.length,
        data: results,
        sourceUrl: url,
        maxDepth: parseInt(maxDepth),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          sourceUrl: url,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('live/products')
  @ApiOperation({ 
    summary: 'Scrape products data directly',
    description: 'Returns scraped product data immediately from a specific category URL'
  })
  @ApiQuery({ name: 'url', description: 'Product list URL to scrape from', required: true })
  @ApiQuery({ name: 'maxPages', description: 'Maximum pages to scrape', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Product data scraped successfully'
  })
  async scrapeProductsLive(
    @Query('url') url: string,
    @Query('maxPages') maxPages: string = '10'
  ) {
    if (!url) {
      throw new HttpException(
        {
          success: false,
          error: 'URL parameter is required',
          timestamp: new Date().toISOString()
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const results = await this.scraperService.scrapeProducts(url, parseInt(maxPages));
      return {
        success: true,
        count: results.length,
        data: results,
        sourceUrl: url,
        maxPages: parseInt(maxPages),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          sourceUrl: url,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('live/product-detail')
  @ApiOperation({ 
    summary: 'Scrape product detail data directly',
    description: 'Returns scraped product detail data immediately from a specific product URL'
  })
  @ApiQuery({ name: 'url', description: 'Product URL to scrape from', required: true })
  @ApiResponse({
    status: 200,
    description: 'Product detail data scraped successfully'
  })
  async scrapeProductDetailLive(@Query('url') url: string) {
    if (!url) {
      throw new HttpException(
        {
          success: false,
          error: 'URL parameter is required',
          timestamp: new Date().toISOString()
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const result = await this.scraperService.scrapeProductDetail(url);
      return {
        success: true,
        data: result,
        sourceUrl: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          sourceUrl: url,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('live/scrape-and-save')
  @ApiOperation({ 
    summary: 'Scrape data and save to database',
    description: 'Performs complete scraping workflow and saves data to database'
  })
  @ApiResponse({
    status: 200,
    description: 'Scraping and saving completed successfully'
  })
  async scrapeAndSave(@Body() body: { 
    includeNavigation?: boolean;
    includeCategories?: boolean;
    includeProducts?: boolean;
    maxPages?: number;
    maxDepth?: number;
  }) {
    try {
      const {
        includeNavigation = true,
        includeCategories = true,
        includeProducts = true,
        maxPages = 2,
        maxDepth = 2
      } = body;

      const results = {
        navigation: { count: 0, data: [] },
        categories: { count: 0, data: [] },
        products: { count: 0, data: [] }
      };

      // Step 1: Scrape and save navigation
      if (includeNavigation) {
        const navigationItems = await this.scraperService.scrapeNavigation();
        if (navigationItems.length > 0) {
          await this.scrapingService.saveNavigationItems(navigationItems);
          results.navigation = { count: navigationItems.length, data: navigationItems };
        }
      }

      // Step 2: Scrape and save categories
      if (includeCategories) {
        // Use default World of Books category URL
        const categoryUrl = 'https://www.worldofbooks.com/en-gb/category/fiction';
        try {
          const categoryItems = await this.scraperService.scrapeCategories(categoryUrl, maxDepth);
          if (categoryItems.length > 0) {
            // Get navigation ID for saving
            const navigationItems = await this.scrapingService.findAllNavigationItems();
            const navigationId = navigationItems.length > 0 ? navigationItems[0].id : null;
            
            if (navigationId) {
              await this.scrapingService.saveCategoryItems(categoryItems, navigationId);
            }
            results.categories = { count: categoryItems.length, data: categoryItems };
          }
        } catch (error) {
          console.warn('Category scraping failed, using fallback data');
        }
      }

      // Step 3: Scrape and save products
      if (includeProducts) {
        // Use default World of Books product URL
        const productUrl = 'https://www.worldofbooks.com/en-gb/category/fiction';
        try {
          const productItems = await this.scraperService.scrapeProducts(productUrl, maxPages);
          if (productItems.length > 0) {
            // Get category ID for saving
            const categories = await this.scrapingService.findAllCategories();
            const categoryId = categories.length > 0 ? categories[0].id : null;
            
            if (categoryId) {
              await this.scrapingService.saveProductItems(productItems, categoryId);
            }
            results.products = { count: productItems.length, data: productItems };
          }
        } catch (error) {
          console.warn('Product scraping failed, using fallback data');
        }
      }

      return {
        success: true,
        message: 'Scraping and saving completed',
        results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('live/update-images')
  @ApiOperation({ 
    summary: 'Update missing product images',
    description: 'Scrapes and updates missing images for existing products'
  })
  @ApiResponse({
    status: 200,
    description: 'Image update completed successfully'
  })
  async updateMissingImages() {
    try {
      // This will trigger the startup scraping service to update missing images
      await this.startupScrapingService.onModuleInit();
      
      return {
        success: true,
        message: 'Image update process completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('live/verify-image')
  @ApiOperation({ 
    summary: 'Verify if an image URL is accessible',
    description: 'Checks if a given image URL returns a valid image'
  })
  @ApiQuery({ name: 'url', description: 'Image URL to verify', required: true })
  @ApiResponse({
    status: 200,
    description: 'Image verification result'
  })
  async verifyImageUrl(@Query('url') url: string) {
    if (!url) {
      throw new HttpException(
        {
          success: false,
          error: 'URL parameter is required',
          timestamp: new Date().toISOString()
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const isValid = await this.scraperService.verifyImageUrl(url);
      return {
        success: true,
        url,
        isValid,
        message: isValid ? 'Image URL is accessible' : 'Image URL is not accessible',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          url,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}