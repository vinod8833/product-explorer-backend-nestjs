import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Category>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.categoryRepository.findAndCount({
      skip,
      take: limit,
      order: { title: 'ASC' },
      relations: ['navigation', 'parent'],
    });

    return new PaginatedResponseDto(categories, total, page, limit);
  }

  async findByNavigation(
    navigationId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Category>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.categoryRepository.findAndCount({
      where: { navigationId, parentId: null }, // Only root categories
      skip,
      take: limit,
      order: { title: 'ASC' },
      relations: ['children'],
    });

    return new PaginatedResponseDto(categories, total, page, limit);
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['navigation', 'parent', 'children', 'products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: ['navigation', 'parent', 'children', 'products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async upsertBySlug(slug: string, data: Partial<Category>): Promise<Category> {
    const existing = await this.categoryRepository.findOne({ where: { slug } });
    
    if (existing) {
      Object.assign(existing, data, { lastScrapedAt: new Date() });
      return this.categoryRepository.save(existing);
    }

    const category = this.categoryRepository.create({
      ...data,
      slug,
      lastScrapedAt: new Date(),
    });
    return this.categoryRepository.save(category);
  }

  async updateProductCount(categoryId: number): Promise<void> {
    const result = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .select('COUNT(product.id)', 'count')
      .where('category.id = :categoryId', { categoryId })
      .getRawOne();

    await this.categoryRepository.update(categoryId, {
      productCount: parseInt(result.count, 10),
    });
  }
}