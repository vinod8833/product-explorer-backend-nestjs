"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const custom_exceptions_1 = require("./common/exceptions/custom-exceptions");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
        const configService = app.get(config_1.ConfigService);
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            res.removeHeader('X-Powered-By');
            next();
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            skipMissingProperties: false,
            validationError: {
                target: false,
                value: false,
            },
            exceptionFactory: (errors) => {
                const messages = errors.map(error => ({
                    field: error.property,
                    errors: Object.values(error.constraints || {}),
                }));
                return new custom_exceptions_1.ValidationException('Validation failed', messages);
            },
        }));
        app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
        app.enableCors({
            origin: (origin, callback) => {
                const allowedOrigins = configService.get('CORS_ORIGIN')?.split(',') || ['http://localhost:3000'];
                if (!origin && configService.get('NODE_ENV') !== 'production') {
                    return callback(null, true);
                }
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    logger.warn(`CORS blocked origin: ${origin}`);
                    callback(null, true);
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-CSRF-Token',
            ],
            exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
            maxAge: 86400,
        });
        app.setGlobalPrefix('api', {
            exclude: ['health', 'metrics'],
        });
        if (configService.get('NODE_ENV') !== 'production') {
            const config = new swagger_1.DocumentBuilder()
                .setTitle('Product Data Explorer API')
                .setDescription('A comprehensive API for product data exploration and management')
                .setVersion('1.0')
                .addBearerAuth()
                .addTag('products', 'Product management endpoints')
                .addTag('categories', 'Category management endpoints')
                .addTag('search', 'Search and filtering endpoints')
                .addTag('scraping', 'Web scraping management endpoints')
                .build();
            const document = swagger_1.SwaggerModule.createDocument(app, config);
            swagger_1.SwaggerModule.setup('api/docs', app, document, {
                swaggerOptions: {
                    persistAuthorization: true,
                },
            });
        }
        app.use('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: configService.get('NODE_ENV'),
                version: process.env.npm_package_version || '1.0.0',
            });
        });
        const port = configService.get('PORT') || process.env.PORT || 3001;
        await app.listen(port, '0.0.0.0');
        logger.log(` Application is running on: http://localhost:${port}`);
        logger.log(` API Documentation: http://localhost:${port}/api/docs`);
        logger.log(` Health Check: http://localhost:${port}/health`);
    }
    catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map