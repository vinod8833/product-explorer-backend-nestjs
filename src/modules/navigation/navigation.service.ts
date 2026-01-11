import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Navigation } from '../../database/entities/navigation.entity';
import { CreateNavigationDto, UpdateNavigationDto } from './dto/navigation.dto';

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(Navigation)
    private navigationRepository: Repository<Navigation>,
  ) {}

  async findAll(): Promise<Navigation[]> {
    return this.navigationRepository.find({
      order: { title: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Navigation> {
    const navigation = await this.navigationRepository.findOne({
      where: { id },
      relations: ['categories'],
    });

    if (!navigation) {
      throw new NotFoundException(`Navigation with ID ${id} not found`);
    }

    return navigation;
  }

  async findBySlug(slug: string): Promise<Navigation> {
    const navigation = await this.navigationRepository.findOne({
      where: { slug },
      relations: ['categories'],
    });

    if (!navigation) {
      throw new NotFoundException(`Navigation with slug ${slug} not found`);
    }

    return navigation;
  }

  async create(createNavigationDto: CreateNavigationDto): Promise<Navigation> {
    const navigation = this.navigationRepository.create(createNavigationDto);
    return this.navigationRepository.save(navigation);
  }

  async update(id: number, updateNavigationDto: UpdateNavigationDto): Promise<Navigation> {
    const navigation = await this.findOne(id);
    Object.assign(navigation, updateNavigationDto);
    return this.navigationRepository.save(navigation);
  }

  async remove(id: number): Promise<void> {
    const navigation = await this.findOne(id);
    await this.navigationRepository.remove(navigation);
  }

  async upsertBySlug(slug: string, data: Partial<Navigation>): Promise<Navigation> {
    const existing = await this.navigationRepository.findOne({ where: { slug } });
    
    if (existing) {
      Object.assign(existing, data, { lastScrapedAt: new Date() });
      return this.navigationRepository.save(existing);
    }

    const navigation = this.navigationRepository.create({
      ...data,
      slug,
      lastScrapedAt: new Date(),
    });
    return this.navigationRepository.save(navigation);
  }
}