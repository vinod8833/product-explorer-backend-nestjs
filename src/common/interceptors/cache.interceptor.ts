import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    if (request.method !== 'GET') {
      return next.handle();
    }

    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheManager.set(cacheKey, result, 300); 
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { url, query } = request;
    return `${url}:${JSON.stringify(query)}`;
  }
}