import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import * as redisStore from 'cache-manager-redis-store';

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
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'product_explorer'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
        maxQueryExecutionTime: 5000, 
        extra: {
          connectionLimit: 10,
          acquireTimeout: 60000,
          timeout: 60000,
        },
      }),
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        url: configService.get('REDIS_URL', 'redis://localhost:6379'),
        ttl: configService.get('CACHE_TTL', 300), 
        max: configService.get('CACHE_MAX_ITEMS', 1000),
        retryAttempts: 3,
        retryDelay: 1000,
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
        },
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
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
    ScrapingModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}