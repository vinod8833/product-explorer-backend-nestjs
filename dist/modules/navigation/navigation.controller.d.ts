import { NavigationService } from './navigation.service';
import { NavigationDto, CreateNavigationDto, UpdateNavigationDto } from './dto/navigation.dto';
export declare class NavigationController {
    private readonly navigationService;
    constructor(navigationService: NavigationService);
    findAll(): Promise<NavigationDto[]>;
    findOne(id: number): Promise<NavigationDto>;
    findBySlug(slug: string): Promise<NavigationDto>;
    create(createNavigationDto: CreateNavigationDto): Promise<NavigationDto>;
    update(id: number, updateNavigationDto: UpdateNavigationDto): Promise<NavigationDto>;
    remove(id: number): Promise<void>;
}
