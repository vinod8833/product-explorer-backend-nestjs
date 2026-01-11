import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { NavigationModule } from './modules/navigation/navigation.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { HealthModule } from './modules/health/health.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Never sync in production
        logging: ['error', 'warn'],
        maxQueryExecutionTime: 10000,
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        extra: {
          connectionLimit: 20,
          acquireTimeout: 60000,
          timeout: 60000,
        },
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: configService.get('THROTTLE_SHORT_LIMIT', 10),
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: configService.get('THROTTLE_MEDIUM_LIMIT', 20),
        },
        {
          name: 'long',
          ttl: 60000,
          limit: configService.get('THROTTLE_LONG_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),

    NavigationModule,
    CategoryModule,
    ProductModule,
    // ScrapingModule, // Disable scraping in production for now
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppProductionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}