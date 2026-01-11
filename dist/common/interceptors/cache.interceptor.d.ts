import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Observable } from 'rxjs';
export declare class CacheInterceptor implements NestInterceptor {
    private cacheManager;
    constructor(cacheManager: Cache);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private generateCacheKey;
}
