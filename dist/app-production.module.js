"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppProductionModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const navigation_module_1 = require("./modules/navigation/navigation.module");
const category_module_1 = require("./modules/category/category.module");
const product_module_1 = require("./modules/product/product.module");
const health_module_1 = require("./modules/health/health.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const logging_middleware_1 = require("./common/middleware/logging.middleware");
let AppProductionModule = class AppProductionModule {
    configure(consumer) {
        consumer.apply(logging_middleware_1.LoggingMiddleware).forRoutes('*');
    }
};
exports.AppProductionModule = AppProductionModule;
exports.AppProductionModule = AppProductionModule = __decorate([
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
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: false,
                    logging: ['error', 'warn'],
                    maxQueryExecutionTime: 10000,
                    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                    extra: {
                        connectionLimit: 20,
                        acquireTimeout: 60000,
                        timeout: 60000,
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
], AppProductionModule);
//# sourceMappingURL=app-production.module.js.map