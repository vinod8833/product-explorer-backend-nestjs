import { CategoryService } from './category.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<CategoryDto>>;
    findByNavigation(navigationId: number, paginationDto: PaginationDto): Promise<PaginatedResponseDto<CategoryDto>>;
    findOne(id: number): Promise<CategoryDto>;
    findBySlug(slug: string): Promise<CategoryDto>;
    create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto>;
    update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto>;
    remove(id: number): Promise<void>;
}
