import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationException } from './common/exceptions/custom-exceptions';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);

    app.use((req: any, res: any, next: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      res.removeHeader('X-Powered-By');
      next();
    });

    app.useGlobalPipes(
      new ValidationPipe({
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
          return new ValidationException('Validation failed', messages);
        },
      }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());

    app.enableCors({
      origin: (origin, callback) => {
        const allowedOrigins = configService.get('CORS_ORIGIN')?.split(',') || ['http://localhost:3000'];
        
        if (!origin && configService.get('NODE_ENV') !== 'production') {
          return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
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

    if (configService.get('NODE_ENV') !== 'production' || configService.get('ENABLE_SWAGGER') === 'true') {
      const config = new DocumentBuilder()
        .setTitle('Product Data Explorer API')
        .setDescription('A comprehensive API for product data exploration and management')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('products', 'Product management endpoints')
        .addTag('categories', 'Category management endpoints')
        .addTag('search', 'Search and filtering endpoints')
        .addTag('scraping', 'Web scraping management endpoints')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
      
      logger.log(`📚 Swagger API docs enabled at: /api/docs`);
    }

    app.use('/health', (req: any, res: any) => {
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
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();