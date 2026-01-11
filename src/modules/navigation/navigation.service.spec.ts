import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NavigationService } from './navigation.service';
import { Navigation } from '../../database/entities/navigation.entity';
import { NotFoundException } from '@nestjs/common';

describe('NavigationService', () => {
  let service: NavigationService;
  let repository: Repository<Navigation>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NavigationService,
        {
          provide: getRepositoryToken(Navigation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NavigationService>(NavigationService);
    repository = module.get<Repository<Navigation>>(getRepositoryToken(Navigation));
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

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
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