import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CacheService } from '../../common/services/cache.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { ProductDto, ProductQueryDto, CreateProductDto, UpdateProductDto } from './dto/product.dto';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SearchResponse<T> extends PaginatedResponse<T> {
  searchTime: number;
  suggestions?: string[];
  facets?: Record<string, any>;
}

@ApiTags('Products')
@Controller('products')
@UseGuards(RateLimitGuard)
export class EnhancedProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get products with advanced filtering and search',
    description: 'Supports full-text search, faceted filtering, and intelligent pagination'
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (ASC/DESC)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiQuery({ name: 'author', required: false, description: 'Filter by author' })
  @ApiQuery({ name: 'inStock', required: false, description: 'Filter by stock status' })
  @ApiQuery({ name: 'facets', required: false, description: 'Include faceted search results' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProducts(
    @Query(ValidationPipe) query: ProductQueryDto,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('facets') includeFacets: boolean = false,
  ): Promise<SearchResponse<ProductDto>> {
    const startTime = Date.now();
    
    const sanitizedQuery = this.sanitizeQuery(query);
    const validatedPagination = this.validatePagination(page, limit);
    
    const cacheKey = this.generateCacheKey('products', {
      ...sanitizedQuery,
      ...validatedPagination,
      facets: includeFacets
    });

    const cached = await this.cacheService.get<SearchResponse<ProductDto>>(cacheKey);
    if (cached) {
      return {
        ...cached,
        searchTime: Date.now() - startTime
      };
    }

    const result = await this.productService.searchProducts(
      sanitizedQuery.q || '', 
      validatedPagination
    );

    const response: SearchResponse<ProductDto> = {
      ...result,
      searchTime: Date.now() - startTime,
    };

    await this.cacheService.set(cacheKey, response, { 
      ttl: 300, 
      tags: ['products', 'search']
    });

    return response;
  }

  @Get('popular')
  @ApiOperation({ 
    summary: 'Get popular products',
    description: 'Returns trending and popular products based on views and ratings'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Time frame (day/week/month)' })
  @ApiResponse({ status: 200, description: 'Popular products retrieved successfully' })
  async getPopularProducts(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('timeframe') timeframe: string = 'week',
  ): Promise<ProductDto[]> {
    const cacheKey = `popular_products_${timeframe}_${limit}`;
    
    return this.cacheService.get(cacheKey, {
      ttl: 1800, 
      tags: ['products', 'popular'],
      fallback: () => this.productService.getPopularProducts(limit, timeframe)
    });
  }

  @Get('recommendations/:id')
  @ApiOperation({ 
    summary: 'Get product recommendations',
    description: 'Returns personalized product recommendations based on the given product'
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendations(
    @Param('id', ParseIntPipe) productId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<ProductDto[]> {
    const cacheKey = `recommendations_${productId}_${limit}`;
    
    return this.cacheService.get(cacheKey, {
      ttl: 3600, 
      tags: ['products', 'recommendations'],
      fallback: () => this.productService.getRecommendations(productId, limit)
    });
  }

  @Get('search/suggestions')
  @ApiOperation({ 
    summary: 'Get search suggestions',
    description: 'Returns autocomplete suggestions for search queries'
  })
  @ApiQuery({ name: 'q', required: true, description: 'Partial search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `suggestions_${query.toLowerCase()}_${limit}`;
    
    return this.cacheService.get(cacheKey, {
      ttl: 3600, 
      tags: ['search', 'suggestions'],
      fallback: () => this.productService.getSearchSuggestions(query, limit)
    });
  }

  @Get('facets')
  @ApiOperation({ 
    summary: 'Get search facets',
    description: 'Returns available facets for filtering products'
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search query to scope facets' })
  @ApiResponse({ status: 200, description: 'Facets retrieved successfully' })
  async getFacets(
    @Query('q') query?: string,
  ): Promise<Record<string, any>> {
    const cacheKey = `facets_${query || 'all'}`;
    
    return this.cacheService.get(cacheKey, {
      ttl: 1800, 
      tags: ['facets', 'search'],
      fallback: () => this.productService.getFacets(query)
    });
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get product by ID',
    description: 'Returns detailed product information including reviews and recommendations'
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({ name: 'include', required: false, description: 'Additional data to include (reviews,recommendations)' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @Param('id', ParseIntPipe) id: number,
    @Query('include') include?: string,
  ): Promise<ProductDto> {
    const includes = include ? include.split(',') : [];
    const cacheKey = `product_${id}_${includes.join('_')}`;
    
    const product = await this.cacheService.get(cacheKey, {
      ttl: 1800, 
      tags: ['products', `product_${id}`],
      fallback: () => this.productService.getProductById(id, includes)
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productService.trackView(id);

    return product as ProductDto;
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create new product',
    description: 'Creates a new product (admin only)'
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
  ): Promise<ProductDto> {
    const product = await this.productService.createProduct(createProductDto);
    
    await this.invalidateProductCaches();
    
    return product;
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update product',
    description: 'Updates an existing product (admin only)'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
  ): Promise<ProductDto> {
    const product = await this.productService.updateProduct(id, updateProductDto);
    
    await this.invalidateProductCaches(id);
    
    return product;
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete product',
    description: 'Deletes a product (admin only)'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.productService.deleteProduct(id);
    
    await this.invalidateProductCaches(id);
  }

  @Post(':id/refresh')
  @ApiOperation({ 
    summary: 'Refresh product data',
    description: 'Triggers a fresh scrape of product data'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 202, description: 'Refresh job queued successfully' })
  @HttpCode(HttpStatus.ACCEPTED)
  async refreshProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; jobId: string }> {
    const jobId = await this.productService.queueProductRefresh(id);
    
    return {
      message: 'Product refresh queued successfully',
      jobId
    };
  }

  @Get('analytics/search')
  @ApiOperation({ 
    summary: 'Get search analytics',
    description: 'Returns search analytics and trends (admin only)'
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to analyze' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getSearchAnalytics(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 7,
  ): Promise<any> {
    const cacheKey = `search_analytics_${days}`;
    
    return this.cacheService.get(cacheKey, {
      ttl: 3600, 
      tags: ['analytics', 'search'],
      fallback: () => this.productService.getSearchAnalytics(days)
    });
  }

  private sanitizeQuery(query: ProductQueryDto): ProductQueryDto {
    return {
      ...query,
      q: query.q?.trim().substring(0, 200), 
      author: query.author?.trim().substring(0, 100),
      publisher: query.publisher?.trim().substring(0, 100),
    };
  }

  private validatePagination(page: number, limit: number): { page: number; limit: number } {
    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)) 
    };
  }

  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${prefix}_${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
  }

  private async invalidateProductCaches(productId?: number): Promise<void> {
    const patterns = [
      'products_*',
      'popular_products_*',
      'facets_*',
      'search_analytics_*'
    ];

    if (productId) {
      patterns.push(`product_${productId}_*`);
      patterns.push(`recommendations_${productId}_*`);
    }

    await Promise.all(
      patterns.map(pattern => this.cacheService.invalidateByPattern(pattern))
    );

    await Promise.all([
      this.cacheService.invalidateByTag('products'),
      this.cacheService.invalidateByTag('search'),
      this.cacheService.invalidateByTag('facets')
    ]);
  }
}