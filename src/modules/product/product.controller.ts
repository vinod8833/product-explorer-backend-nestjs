import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { WorldOfBooksApiService } from '../scraping/world-of-books-api.service';
import {
  ProductDto,
  ProductDetailDto,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productService: ProductService,
    private readonly worldOfBooksApiService: WorldOfBooksApiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with search and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products',
    type: PaginatedResponseDto<ProductDto>,
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 20;
    
    return this.productService.findAll({ page, limit }, searchDto);
  }

  @Get('mixed')
  @ApiOperation({ summary: 'Get mixed products (local + live data)' })
  @ApiResponse({
    status: 200,
    description: 'Mixed paginated list of products',
    type: PaginatedResponseDto<ProductDto>,
  })
  async findMixed(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductDto>> {
    const { page = 1, limit = 20 } = paginationDto;
    
    try {
      const localProducts = await this.productService.findAll({ page, limit: Math.floor(limit / 2) }, searchDto);
      
      const remainingSlots = limit - localProducts.data.length;
      let liveProducts = { products: [], totalHits: 0, currentPage: 0, totalPages: 0 };
      
      if (remainingSlots > 0) {
        const liveFilters = {
          query: searchDto.q,
          author: searchDto.author,
          priceMin: searchDto.minPrice,
          priceMax: searchDto.maxPrice,
          conditions: searchDto.conditions ? searchDto.conditions.split(',') : undefined,
        };
        
        liveProducts = await this.worldOfBooksApiService.searchProducts(
          liveFilters,
          page - 1,
          remainingSlots,
        );
      }

      const transformedLiveProducts = liveProducts.products.map(product => ({
        id: parseInt(product.sourceId) || Math.random() * 1000000,
        sourceId: product.sourceId,
        categoryId: null,
        title: product.title,
        author: product.author,
        price: product.price,
        currency: product.currency,
        imageUrl: product.imageUrl,
        sourceUrl: product.sourceUrl,
        inStock: product.inStock,
        lastScrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isLive: true, 
      }));

      const combinedData = [...localProducts.data, ...transformedLiveProducts];
      const totalCombined = localProducts.total + liveProducts.totalHits;

      return {
        data: combinedData,
        total: totalCombined,
        page,
        limit,
        totalPages: Math.ceil(totalCombined / limit),
        hasNext: page < Math.ceil(totalCombined / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error('Error in mixed search:', error);
      return this.productService.findAll({ page, limit }, searchDto);
    }
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products for category',
    type: PaginatedResponseDto<ProductDto>,
  })
  async findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductDto>> {
    return this.productService.findByCategory(categoryId, paginationDto, searchDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by query' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({
    status: 200,
    description: 'Paginated search results',
    type: PaginatedResponseDto<ProductDto>,
  })
  async search(
    @Query('q') query: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductDto>> {
    return this.productService.search(query, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID with full details' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product details with reviews',
    type: ProductDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductDetailDto> {
    return this.productService.findOne(id);
  }

  @Get('source/:sourceId')
  @ApiOperation({ summary: 'Get product by source ID' })
  @ApiParam({ name: 'sourceId', description: 'Source ID from World of Books' })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySourceId(@Param('sourceId') sourceId: string): Promise<ProductDetailDto> {
    return this.productService.findBySourceId(sourceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductDto,
  })
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductDto> {
    return this.productService.create(createProductDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productService.remove(id);
  }

  @Get('live/search')
  @ApiOperation({ summary: 'Search products using World of Books API (live data)' })
  @ApiQuery({ name: 'q', description: 'Search query', required: false })
  @ApiQuery({ name: 'author', description: 'Filter by author', required: false })
  @ApiQuery({ name: 'minPrice', description: 'Minimum price', required: false })
  @ApiQuery({ name: 'maxPrice', description: 'Maximum price', required: false })
  @ApiQuery({ name: 'conditions', description: 'Book conditions (comma-separated)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Live search results from World of Books',
  })
  async searchLive(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: ProductQueryDto,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    
    const filters = {
      query: searchDto.q,
      author: searchDto.author,
      priceMin: searchDto.minPrice,
      priceMax: searchDto.maxPrice,
      conditions: searchDto.conditions ? searchDto.conditions.split(',') : undefined,
    };

    const result = await this.worldOfBooksApiService.searchProducts(
      filters,
      page - 1, 
      limit,
    );

    return {
      data: result.products,
      total: result.totalHits,
      page: result.currentPage + 1, 
      totalPages: result.totalPages,
      hasNext: result.currentPage + 1 < result.totalPages,
      hasPrev: result.currentPage > 0,
    };
  }

  @Get('live/advanced')
  @ApiOperation({ summary: 'Advanced search with multiple filters (live data)' })
  @ApiQuery({ name: 'q', description: 'Search query', required: false })
  @ApiQuery({ name: 'author', description: 'Filter by author', required: false })
  @ApiQuery({ name: 'publisher', description: 'Filter by publisher', required: false })
  @ApiQuery({ name: 'minPrice', description: 'Minimum price', required: false })
  @ApiQuery({ name: 'maxPrice', description: 'Maximum price', required: false })
  @ApiQuery({ name: 'conditions', description: 'Book conditions (comma-separated)', required: false })
  @ApiQuery({ name: 'categories', description: 'Categories (comma-separated)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Advanced search results from World of Books',
  })
  async advancedSearchLive(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: ProductQueryDto,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    
    const searchOptions = {
      query: searchDto.q,
      author: searchDto.author,
      publisher: searchDto.publisher,
      priceMin: searchDto.minPrice,
      priceMax: searchDto.maxPrice,
      conditions: searchDto.conditions ? searchDto.conditions.split(',') : undefined,
      categories: searchDto.categories ? searchDto.categories.split(',') : undefined,
      page: page - 1, 
      hitsPerPage: limit,
    };

    const result = await this.worldOfBooksApiService.getAdvancedSearch(searchOptions);

    return {
      data: result.products,
      total: result.totalHits,
      page: result.currentPage + 1, 
      totalPages: result.totalPages,
      hasNext: result.currentPage + 1 < result.totalPages,
      hasPrev: result.currentPage > 0,
      facets: result.facets, 
    };
  }

  @Get('live/budget')
  @ApiOperation({ summary: 'Get budget books under specified price (live data)' })
  @ApiQuery({ name: 'maxPrice', description: 'Maximum price', required: false })
  @ApiResponse({
    status: 200,
    description: 'Budget books from World of Books',
  })
  async getBudgetBooks(
    @Query() paginationDto: PaginationDto,
    @Query('maxPrice') maxPrice?: number,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    
    const result = await this.worldOfBooksApiService.getBudgetBooks(
      maxPrice || 2.99,
      page - 1,
      limit,
    );

    return {
      data: result.products,
      total: result.totalHits,
      page: result.currentPage + 1,
      totalPages: result.totalPages,
      hasNext: result.currentPage + 1 < result.totalPages,
      hasPrev: result.currentPage > 0,
    };
  }

  @Get('live/collection/:collectionId')
  @ApiOperation({ summary: 'Get products from a specific collection (live data)' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  @ApiResponse({
    status: 200,
    description: 'Products from collection',
  })
  async getCollectionProducts(
    @Param('collectionId') collectionId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    
    const result = await this.worldOfBooksApiService.getProductsByCollection(
      collectionId,
      page - 1,
      limit,
    );

    return {
      data: result.products,
      total: result.totalHits,
      page: result.currentPage + 1,
      totalPages: result.totalPages,
      hasNext: result.currentPage + 1 < result.totalPages,
      hasPrev: result.currentPage > 0,
    };
  }

  @Get('live/ids')
  @ApiOperation({ summary: 'Get products by specific IDs (live data)' })
  @ApiQuery({ name: 'ids', description: 'Comma-separated product IDs' })
  @ApiResponse({
    status: 200,
    description: 'Products by IDs',
  })
  async getProductsByIds(@Query('ids') ids: string) {
    const productIds = ids.split(',').map(id => id.trim());
    const products = await this.worldOfBooksApiService.getProductsByIds(productIds);
    
    return {
      data: products,
      total: products.length,
    };
  }

  @Get('live/cart')
  @ApiOperation({ summary: 'Get cart information (live data)' })
  @ApiResponse({
    status: 200,
    description: 'Cart information',
  })
  async getCartInfo() {
    return this.worldOfBooksApiService.getCartInfo();
  }
}