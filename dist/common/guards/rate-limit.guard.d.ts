import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class RateLimitGuard implements CanActivate {
    private requests;
    private readonly maxRequests;
    private readonly windowMs;
    canActivate(context: ExecutionContext): boolean;
}
