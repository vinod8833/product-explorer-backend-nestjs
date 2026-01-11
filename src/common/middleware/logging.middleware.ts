import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';

    this.logger.log(`${method} ${originalUrl} - ${ip} - ${userAgent}`);

    const originalEnd = res.end.bind(res);
    
    res.end = (chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): Response => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('Content-Length') || 0;

      const logLevel = statusCode >= 400 ? 'warn' : 'log';
      const logger = new Logger(LoggingMiddleware.name);
      
      logger[logLevel](
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms - ${ip}`,
      );

      if (typeof encoding === 'function') {
        return originalEnd(chunk, encoding);
      } else {
        return originalEnd(chunk, encoding, cb);
      }
    };

    next();
  }
}