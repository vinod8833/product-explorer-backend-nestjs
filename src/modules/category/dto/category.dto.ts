import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Navigation ID' })
  navigationId: number;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId?: number;

  @ApiProperty({ description: 'Category title' })
  title: string;

  @ApiProperty({ description: 'Category slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  sourceUrl?: string;

  @ApiProperty({ description: 'Product count' })
  productCount: number;

  @ApiPropertyOptional({ description: 'Last scraped timestamp' })
  lastScrapedAt?: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Child categories', type: [CategoryDto] })
  children?: CategoryDto[];
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Navigation ID' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  navigationId: number;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  parentId?: number;

  @ApiProperty({ description: 'Category title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Category slug' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Product count' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productCount?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Category title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Product count' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productCount?: number;
}