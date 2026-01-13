import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductImageService } from './product-image-service';
import { EnhancedProductController } from './enhanced-product.controller';
import { Product } from '../../database/entities/product.entity';
import { ProductDetail } from '../../database/entities/product-detail.entity';
import { Review } from '../../database/entities/review.entity';
import { ScrapingModule } from '../scraping/scraping.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductDetail, Review]),
    ScrapingModule,
  ],
  controllers: [ProductController, EnhancedProductController],
  providers: [ProductService, ProductImageService],
  exports: [ProductService, ProductImageService],
})
export class ProductModule {}