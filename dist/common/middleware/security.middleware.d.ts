import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
export declare class SecurityMiddleware implements NestMiddleware {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    use(req: Request, res: Response, next: NextFunction): void;
}
export declare const createRateLimiter: (configService: ConfigService) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const createSlowDown: (configService: ConfigService) => (req: Request, res: Response, next: NextFunction) => void;
