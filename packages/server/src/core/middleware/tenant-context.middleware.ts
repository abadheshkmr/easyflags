import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Middleware to establish tenant context for row-level security
 * This sets the application-level tenant context for the database connection
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);
  
  constructor(private readonly configService: ConfigService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.user?.['id'] || 'anonymous';
    const path = req.path;
    const method = req.method;
    
    // Log the request with tenant context
    this.logger.log(
      `REQUEST [${method}] ${path} | User: ${userId} | Tenant: ${tenantId || 'none'}`
    );
    
    if (!tenantId) {
      this.logger.debug(`No tenant ID provided for path: ${path}`);
      return next(); // Allow the request to continue without tenant context for routes that don't need it
    }
    
    try {
      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
        this.logger.warn(
          `Invalid tenant ID format: "${tenantId}" | User: ${userId} | Path: ${path}`
        );
        return res.status(400).json({
          statusCode: 400,
          message: 'Invalid tenant ID format',
          error: 'Bad Request'
        });
      }
      
      // Store in request for application use - we'll set database context in repositories instead
      req['tenantId'] = tenantId;
      
      this.logger.debug(
        `Tenant context set: "${tenantId}" | User: ${userId} | Path: ${path}`
      );
      
      next();
    } catch (error) {
      this.logger.error(
        `Error setting tenant context: ${error.message} | User: ${userId} | Tenant: ${tenantId} | Path: ${path}`,
        error.stack
      );
      return res.status(500).json({
        statusCode: 500,
        message: 'Error setting tenant context',
        error: 'Internal Server Error'
      });
    }
  }
} 