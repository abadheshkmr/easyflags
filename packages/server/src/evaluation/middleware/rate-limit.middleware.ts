import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

/**
 * Middleware for rate limiting API requests
 * Limits the number of requests per time window based on tenant ID
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly defaultRateLimit: number;
  private readonly windowMs: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService
  ) {
    // Default to 100 requests per second per tenant
    this.defaultRateLimit = this.configService.get<number>('DEFAULT_RATE_LIMIT', 100);
    this.windowMs = this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 1000);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return next();
    }

    try {
      // Each tenant has its own rate limit counter
      const key = `ratelimit:${tenantId}:${this.getCurrentWindow()}`;
      
      // Get current count
      const currentCount = await this.cacheManager.get<number>(key) || 0;
      
      // Get tenant-specific rate limit
      const tenantRateLimit = await this.getTenantRateLimit(tenantId);
      
      if (currentCount >= tenantRateLimit) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          error: 'Too Many Requests',
          limit: tenantRateLimit,
          current: currentCount,
          resetAt: new Date(Date.now() + (this.windowMs - (Date.now() % this.windowMs))).toISOString()
        });
      }
      
      // Increment counter
      await this.cacheManager.set(key, currentCount + 1, this.windowMs);
      
      // Add rate limit headers
      res.header('X-RateLimit-Limit', String(tenantRateLimit));
      res.header('X-RateLimit-Remaining', String(tenantRateLimit - (currentCount + 1)));
      res.header('X-RateLimit-Reset', String(Math.ceil((Date.now() + (this.windowMs - (Date.now() % this.windowMs))) / 1000)));
      
      next();
    } catch (error) {
      console.error('Error in rate limit middleware:', error);
      // Don't block the request if there's an error with rate limiting
      next();
    }
  }

  /**
   * Get tenant-specific rate limit
   * This could be extended to look up tenant configuration from database
   */
  private async getTenantRateLimit(tenantId: string): Promise<number> {
    // For now, just use default rate limit
    // In a production system, this would look up tenant-specific limits
    return this.defaultRateLimit;
  }

  /**
   * Get the current time window
   */
  private getCurrentWindow(): number {
    return Math.floor(Date.now() / this.windowMs);
  }
} 