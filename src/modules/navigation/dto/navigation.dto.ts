import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsDateString } from 'class-validator';

export class NavigationDto {
  @ApiProperty({ description: 'Navigation ID' })
  id: number;

  @ApiProperty({ description: 'Navigation title' })
  title: string;

  @ApiProperty({ description: 'Navigation slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Last scraped timestamp' })
  lastScrapedAt?: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class CreateNavigationDto {
  @ApiProperty({ description: 'Navigation title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Navigation slug' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;
}

export class UpdateNavigationDto {
  @ApiPropertyOptional({ description: 'Navigation title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Last scraped timestamp' })
  @IsOptional()
  @IsDateString()
  lastScrapedAt?: Date;
}