import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Navigation } from './entities/navigation.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductDetail } from './entities/product-detail.entity';
import { Review } from './entities/review.entity';
import { ScrapeJob } from './entities/scrape-job.entity';
import { ViewHistory } from './entities/view-history.entity';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_NAME', 'product_explorer'),
  entities: [
    Navigation,
    Category,
    Product,
    ProductDetail,
    Review,
    ScrapeJob,
    ViewHistory,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
});