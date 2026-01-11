import { Repository } from 'typeorm';
import { Navigation } from '../../database/entities/navigation.entity';
import { CreateNavigationDto, UpdateNavigationDto } from './dto/navigation.dto';
export declare class NavigationService {
    private navigationRepository;
    constructor(navigationRepository: Repository<Navigation>);
    findAll(): Promise<Navigation[]>;
    findOne(id: number): Promise<Navigation>;
    findBySlug(slug: string): Promise<Navigation>;
    create(createNavigationDto: CreateNavigationDto): Promise<Navigation>;
    update(id: number, updateNavigationDto: UpdateNavigationDto): Promise<Navigation>;
    remove(id: number): Promise<void>;
    upsertBySlug(slug: string, data: Partial<Navigation>): Promise<Navigation>;
}
