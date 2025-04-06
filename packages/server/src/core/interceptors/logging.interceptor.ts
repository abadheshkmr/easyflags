import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from '../../common/audit/audit-log.service';

/**
 * Global interceptor for capturing and logging all API interactions
 * particularly useful for security audit trail
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API');

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    const userId = req.user?.id || 'anonymous';
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'none';
    const startTime = Date.now();
    
    // Log the request
    this.logger.log(`Request: ${method} ${url} | User: ${userId} | Tenant: ${tenantId}`);
    
    return next.handle().pipe(
      tap(response => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log the successful response
        this.logger.log(
          `Response: ${method} ${url} | Status: SUCCESS | User: ${userId} | Tenant: ${tenantId} | Duration: ${duration}ms`
        );
        
        // For sensitive operations, log them to the audit log
        if (this.isSensitiveOperation(method, url)) {
          this.auditLogService.logTenantAccess(
            tenantId as string,
            userId as string,
            `${method} ${url}`,
            true
          );
        }
      }),
      catchError(error => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const status = error.status || 500;
        const errorMessage = error.message || 'Unknown error';
        
        // Log the error
        this.logger.error(
          `Response: ${method} ${url} | Status: ERROR ${status} | User: ${userId} | Tenant: ${tenantId} | Duration: ${duration}ms | Error: ${errorMessage}`,
          error.stack
        );
        
        // For authentication failures, log them specially
        if (status === 401 || status === 403) {
          this.auditLogService.logAuthFailure(
            userId as string, 
            tenantId as string, 
            url,
            method,
            errorMessage
          );
        } else if (this.isSensitiveOperation(method, url)) {
          // For other errors in sensitive operations
          this.auditLogService.logTenantError(
            error,
            {
              tenantId: tenantId as string,
              userId: userId as string,
              operation: `${method} ${url}`,
              details: { body: this.sanitizeData(body) }
            }
          );
        }
        
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Determines if an operation should be considered sensitive for logging
   */
  private isSensitiveOperation(method: string, url: string): boolean {
    // Tenant operations
    if (url.includes('/api/tenants')) {
      return true;
    }
    
    // Admin operations
    if (url.includes('/api/admin')) {
      return true;
    }
    
    // Authentication operations
    if (url.includes('/api/auth')) {
      return true;
    }
    
    // Write operations for flags
    if (url.includes('/api/flags') && (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Sanitize sensitive data from request bodies before logging
   */
  private sanitizeData(data: any): any {
    if (!data) {
      return {};
    }
    
    // Create a copy to avoid modifying the original
    const sanitized = { ...data };
    
    // Remove sensitive fields
    if (sanitized.password) {
      sanitized.password = '********';
    }
    
    if (sanitized.apiKey) {
      sanitized.apiKey = '********';
    }
    
    if (sanitized.token) {
      sanitized.token = '********';
    }
    
    return sanitized;
  }
} 