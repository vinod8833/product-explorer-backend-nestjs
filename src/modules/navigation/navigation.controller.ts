import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NavigationService } from './navigation.service';
import { NavigationDto, CreateNavigationDto, UpdateNavigationDto } from './dto/navigation.dto';

@ApiTags('navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all navigation items' })
  @ApiResponse({
    status: 200,
    description: 'List of navigation items',
    type: [NavigationDto],
  })
  async findAll(): Promise<NavigationDto[]> {
    return this.navigationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get navigation item by ID' })
  @ApiParam({ name: 'id', description: 'Navigation ID' })
  @ApiResponse({
    status: 200,
    description: 'Navigation item details',
    type: NavigationDto,
  })
  @ApiResponse({ status: 404, description: 'Navigation item not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<NavigationDto> {
    return this.navigationService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get navigation item by slug' })
  @ApiParam({ name: 'slug', description: 'Navigation slug' })
  @ApiResponse({
    status: 200,
    description: 'Navigation item details',
    type: NavigationDto,
  })
  @ApiResponse({ status: 404, description: 'Navigation item not found' })
  async findBySlug(@Param('slug') slug: string): Promise<NavigationDto> {
    return this.navigationService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create new navigation item' })
  @ApiResponse({
    status: 201,
    description: 'Navigation item created successfully',
    type: NavigationDto,
  })
  async create(@Body() createNavigationDto: CreateNavigationDto): Promise<NavigationDto> {
    return this.navigationService.create(createNavigationDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update navigation item' })
  @ApiParam({ name: 'id', description: 'Navigation ID' })
  @ApiResponse({
    status: 200,
    description: 'Navigation item updated successfully',
    type: NavigationDto,
  })
  @ApiResponse({ status: 404, description: 'Navigation item not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNavigationDto: UpdateNavigationDto,
  ): Promise<NavigationDto> {
    return this.navigationService.update(id, updateNavigationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete navigation item' })
  @ApiParam({ name: 'id', description: 'Navigation ID' })
  @ApiResponse({ status: 200, description: 'Navigation item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Navigation item not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.navigationService.remove(id);
  }
}