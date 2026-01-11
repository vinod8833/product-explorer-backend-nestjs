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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of categories',
    type: PaginatedResponseDto<CategoryDto>,
  })
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<CategoryDto>> {
    return this.categoryService.findAll(paginationDto);
  }

  @Get('navigation/:navigationId')
  @ApiOperation({ summary: 'Get categories by navigation ID' })
  @ApiParam({ name: 'navigationId', description: 'Navigation ID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of categories for navigation',
    type: PaginatedResponseDto<CategoryDto>,
  })
  async findByNavigation(
    @Param('navigationId', ParseIntPipe) navigationId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<CategoryDto>> {
    return this.categoryService.findByNavigation(navigationId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: CategoryDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryDto> {
    return this.categoryService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: CategoryDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryDto> {
    return this.categoryService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryDto,
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
    return this.categoryService.create(createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoryService.remove(id);
  }
}