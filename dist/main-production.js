"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_production_module_1 = require("./app-production.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const custom_exceptions_1 = require("./common/exceptions/custom-exceptions");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    try {
        logger.log('Starting Product Explorer Backend (Production Mode)');
        const app = await core_1.NestFactory.create(app_production_module_1.AppProductionModule, {
            logger: ['error', 'warn', 'log'],
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
            origin: true,
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
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Product Data Explorer API')
            .setDescription('A comprehensive API for product data exploration and management')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('products', 'Product management endpoints')
            .addTag('categories', 'Category management endpoints')
            .addTag('search', 'Search and filtering endpoints')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });
        app.use('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: configService.get('NODE_ENV'),
                version: '1.0.0',
                database: 'connected',
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                },
            });
        });
        app.use('/', (req, res, next) => {
            if (req.url === '/') {
                res.status(200).json({
                    message: 'Product Data Explorer API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString(),
                    endpoints: {
                        health: '/health',
                        api: '/api',
                        docs: '/api/docs'
                    }
                });
            }
            else {
                next();
            }
        });
        const port = configService.get('PORT') || process.env.PORT || 3001;
        const host = configService.get('HOST', '0.0.0.0');
        await app.listen(port, host);
        logger.log(`Application is running on: http://${host}:${port}`);
        logger.log(`API Documentation: http://${host}:${port}/api/docs`);
        logger.log(`Health Check: http://${host}:${port}/health`);
        logger.log(`Environment: ${configService.get('NODE_ENV')}`);
        logger.log(`Database URL: ${configService.get('DATABASE_URL') ? 'Connected' : 'Not configured'}`);
        if (configService.get('NODE_ENV') !== 'production') {
            logger.log('Environment variables:', {
                PORT: process.env.PORT,
                HOST: process.env.HOST,
                NODE_ENV: process.env.NODE_ENV,
                DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
            });
        }
    }
    catch (error) {
        logger.error(' Failed to start application:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main-production.js.map