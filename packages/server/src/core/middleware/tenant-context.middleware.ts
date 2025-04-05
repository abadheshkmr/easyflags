import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Middleware to establish tenant context for row-level security
 * This sets the application-level tenant context for the database connection
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return next(); // Allow the request to continue without tenant context for routes that don't need it
    }
    
    try {
      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Invalid tenant ID format',
          error: 'Bad Request'
        });
      }
      
      // Store in request for application use - we'll set database context in repositories instead
      req['tenantId'] = tenantId;
      
      next();
    } catch (error) {
      console.error('Error setting tenant context:', error);
      return res.status(500).json({
        statusCode: 500,
        message: 'Error setting tenant context',
        error: 'Internal Server Error'
      });
    }
  }
} 