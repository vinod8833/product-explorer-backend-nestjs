import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  }
}

export const createRateLimiter = (configService: ConfigService) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const maxRequests = configService.get('RATE_LIMIT_MAX', 100);
  const windowMs = 15 * 60 * 1000; // 15 minutes

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const userRequests = requests.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }

    userRequests.count++;
    next();
  };
};

export const createSlowDown = (configService: ConfigService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};