"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const cache_manager_1 = require("@nestjs/cache-manager");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const redisStore = require("cache-manager-redis-store");
const navigation_module_1 = require("./modules/navigation/navigation.module");
const category_module_1 = require("./modules/category/category.module");
const product_module_1 = require("./modules/product/product.module");
const scraping_module_1 = require("./modules/scraping/scraping.module");
const health_module_1 = require("./modules/health/health.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const logging_middleware_1 = require("./common/middleware/logging.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logging_middleware_1.LoggingMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: true,
                },
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
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
                inject: [config_1.ConfigService],
            }),
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    store: redisStore,
                    url: configService.get('REDIS_URL', 'redis://localhost:6379'),
                    ttl: configService.get('CACHE_TTL', 300),
                    max: configService.get('CACHE_MAX_ITEMS', 1000),
                    retryAttempts: 3,
                    retryDelay: 1000,
                }),
                inject: [config_1.ConfigService],
                isGlobal: true,
            }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
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
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => [
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
                inject: [config_1.ConfigService],
            }),
            navigation_module_1.NavigationModule,
            category_module_1.CategoryModule,
            product_module_1.ProductModule,
            scraping_module_1.ScrapingModule,
            health_module_1.HealthModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map