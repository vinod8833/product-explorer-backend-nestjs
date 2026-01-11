"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const navigation_service_1 = require("./navigation.service");
const navigation_entity_1 = require("../../database/entities/navigation.entity");
const common_1 = require("@nestjs/common");
describe('NavigationService', () => {
    let service;
    let repository;
    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                navigation_service_1.NavigationService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(navigation_entity_1.Navigation),
                    useValue: mockRepository,
                },
            ],
        }).compile();
        service = module.get(navigation_service_1.NavigationService);
        repository = module.get((0, typeorm_1.getRepositoryToken)(navigation_entity_1.Navigation));
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('findAll', () => {
        it('should return an array of navigation items', async () => {
            const mockNavigation = [
                { id: 1, title: 'Books', slug: 'books' },
                { id: 2, title: 'Fiction', slug: 'fiction' },
            ];
            mockRepository.find.mockResolvedValue(mockNavigation);
            const result = await service.findAll();
            expect(result).toEqual(mockNavigation);
            expect(mockRepository.find).toHaveBeenCalledWith({
                order: { title: 'ASC' },
            });
        });
    });
    describe('findOne', () => {
        it('should return a navigation item', async () => {
            const mockNavigation = { id: 1, title: 'Books', slug: 'books' };
            mockRepository.findOne.mockResolvedValue(mockNavigation);
            const result = await service.findOne(1);
            expect(result).toEqual(mockNavigation);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['categories'],
            });
        });
        it('should throw NotFoundException when navigation not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.findOne(999)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('create', () => {
        it('should create and return a navigation item', async () => {
            const createDto = { title: 'New Category', slug: 'new-category' };
            const mockNavigation = { id: 1, ...createDto };
            mockRepository.create.mockReturnValue(mockNavigation);
            mockRepository.save.mockResolvedValue(mockNavigation);
            const result = await service.create(createDto);
            expect(result).toEqual(mockNavigation);
            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(mockRepository.save).toHaveBeenCalledWith(mockNavigation);
        });
    });
});
//# sourceMappingURL=navigation.service.spec.js.map