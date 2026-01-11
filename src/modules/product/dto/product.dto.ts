import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsNumber, IsPositive, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductDto {
  @ApiProperty({ description: 'Product ID' })
  id: number;

  @ApiProperty({ description: 'Source ID from World of Books' })
  sourceId: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: number;

  @ApiProperty({ description: 'Product title' })
  title: string;

  @ApiPropertyOptional({ description: 'Product author' })
  author?: string;

  @ApiPropertyOptional({ description: 'Product price' })
  price?: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Product image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Source URL' })
  sourceUrl: string;

  @ApiProperty({ description: 'In stock status' })
  inStock: boolean;

  @ApiPropertyOptional({ description: 'Last scraped timestamp' })
  lastScrapedAt?: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class ReviewDto {
  @ApiProperty({ description: 'Review ID' })
  id: number;

  @ApiProperty({ description: 'Product ID' })
  productId: number;

  @ApiPropertyOptional({ description: 'Review author' })
  author?: string;

  @ApiPropertyOptional({ description: 'Rating (1-5)' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Review text' })
  text?: string;

  @ApiPropertyOptional({ description: 'Review date' })
  reviewDate?: Date;

  @ApiProperty({ description: 'Helpful count' })
  helpfulCount: number;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}

export class ProductDetailDto extends ProductDto {
  @ApiPropertyOptional({ description: 'Product description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product specifications' })
  specs?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Average rating' })
  ratingsAvg?: number;

  @ApiPropertyOptional({ description: 'Number of reviews' })
  reviewsCount?: number;

  @ApiPropertyOptional({ description: 'Publisher' })
  publisher?: string;

  @ApiPropertyOptional({ description: 'Publication date' })
  publicationDate?: Date;

  @ApiPropertyOptional({ description: 'ISBN' })
  isbn?: string;

  @ApiPropertyOptional({ description: 'Page count' })
  pageCount?: number;

  @ApiPropertyOptional({ description: 'Genres', type: [String] })
  genres?: string[];

  @ApiPropertyOptional({ description: 'Product reviews', type: [ReviewDto] })
  reviews?: ReviewDto[];
}

export class CreateProductDto {
  @ApiProperty({ description: 'Source ID from World of Books' })
  @IsString()
  sourceId: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  categoryId?: number;

  @ApiProperty({ description: 'Product title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Product author' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Product price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Product image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Source URL' })
  @IsUrl()
  sourceUrl: string;

  @ApiPropertyOptional({ description: 'In stock status' })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Product author' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Product price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Product image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'In stock status' })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;
}

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Category ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Navigation slug filter' })
  @IsOptional()
  @IsString()
  navigation?: string;

  @ApiPropertyOptional({ description: 'Category slug filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Author filter' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'In stock filter' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order (ASC/DESC)' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Book conditions (comma-separated)' })
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiPropertyOptional({ description: 'Categories (comma-separated)' })
  @IsOptional()
  @IsString()
  categories?: string;

  @ApiPropertyOptional({ description: 'Publisher filter' })
  @IsOptional()
  @IsString()
  publisher?: string;
}