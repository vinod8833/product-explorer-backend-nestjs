import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
export declare class CategoryService {
    private categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Category>>;
    findByNavigation(navigationId: number, paginationDto: PaginationDto): Promise<PaginatedResponseDto<Category>>;
    findOne(id: number): Promise<Category>;
    findBySlug(slug: string): Promise<Category>;
    create(createCategoryDto: CreateCategoryDto): Promise<Category>;
    update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category>;
    remove(id: number): Promise<void>;
    upsertBySlug(slug: string, data: Partial<Category>): Promise<Category>;
    updateProductCount(categoryId: number): Promise<void>;
}
