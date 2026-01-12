import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests = 100; 
  private readonly windowMs = 15 * 60 * 1000; 

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    
    const now = Date.now();
    const userRequests = this.requests.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
      this.requests.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (userRequests.count >= this.maxRequests) {
      throw new HttpException(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    userRequests.count++;
    return true;
  }
}