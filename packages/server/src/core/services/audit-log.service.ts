import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Service for tracking and logging sensitive operations
 * Particularly focused on tenant management activities
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly isDetailedLoggingEnabled: boolean;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.isDetailedLoggingEnabled = this.configService.get<boolean>('ENABLE_DETAILED_AUDIT_LOGS', true);
  }

  /**
   * Log tenant creation events
   */
  logTenantCreation(tenantId: string, tenantName: string, userId: string, source: string): void {
    this.logger.log(
      `AUDIT: Tenant created | ID: ${tenantId} | Name: ${tenantName} | By: ${userId} | Source: ${source}`
    );
    
    // Additional detailed logging if enabled
    if (this.isDetailedLoggingEnabled) {
      this.logDetail('TENANT_CREATED', {
        tenantId,
        tenantName,
        userId,
        source,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log tenant update events
   */
  logTenantUpdate(tenantId: string, tenantName: string, userId: string, changes: Record<string, any>): void {
    this.logger.log(
      `AUDIT: Tenant updated | ID: ${tenantId} | Name: ${tenantName} | By: ${userId}`
    );
    
    if (this.isDetailedLoggingEnabled) {
      this.logDetail('TENANT_UPDATED', {
        tenantId,
        tenantName,
        userId,
        changes,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log tenant deletion events
   */
  logTenantDeletion(tenantId: string, tenantName: string, userId: string): void {
    this.logger.log(
      `AUDIT: Tenant deleted | ID: ${tenantId} | Name: ${tenantName} | By: ${userId}`
    );
    
    if (this.isDetailedLoggingEnabled) {
      this.logDetail('TENANT_DELETED', {
        tenantId,
        tenantName,
        userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log tenant access events (useful for security monitoring)
   */
  logTenantAccess(tenantId: string, userId: string, action: string, success: boolean): void {
    this.logger.log(
      `AUDIT: Tenant access | ID: ${tenantId} | By: ${userId} | Action: ${action} | Success: ${success}`
    );
    
    if (this.isDetailedLoggingEnabled) {
      this.logDetail('TENANT_ACCESS', {
        tenantId,
        userId,
        action,
        success,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log tenant operation errors (permissions, validation failures, etc)
   */
  logTenantError(
    error: Error | string, 
    context: {
      tenantId?: string, 
      userId?: string, 
      operation: string, 
      details?: Record<string, any>
    }
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.logger.error(
      `AUDIT ERROR: ${context.operation} | Tenant: ${context.tenantId || 'unknown'} | User: ${context.userId || 'unknown'} | Error: ${errorMessage}`,
      errorStack
    );
    
    if (this.isDetailedLoggingEnabled) {
      this.logDetail('TENANT_ERROR', {
        error: errorMessage,
        tenantId: context.tenantId,
        userId: context.userId,
        operation: context.operation,
        details: context.details,
        timestamp: new Date().toISOString(),
        stack: errorStack
      });
    }
  }

  /**
   * Log authorization/authentication failures
   */
  logAuthFailure(
    userId: string | undefined, 
    tenantId: string | undefined, 
    resource: string, 
    operation: string, 
    reason: string
  ): void {
    this.logger.warn(
      `SECURITY: Auth failure | Resource: ${resource} | Operation: ${operation} | ` +
      `User: ${userId || 'anonymous'} | Tenant: ${tenantId || 'none'} | Reason: ${reason}`
    );
    
    if (this.isDetailedLoggingEnabled) {
      this.logDetail('AUTH_FAILURE', {
        userId: userId || 'anonymous',
        tenantId: tenantId || 'none',
        resource,
        operation,
        reason,
        timestamp: new Date().toISOString(),
        ipAddress: 'N/A', // In a real system, you would capture the client IP
        userAgent: 'N/A'  // In a real system, you would capture the user agent
      });
    }
  }

  /**
   * Private method for detailed structured logging
   * In a production environment, this could be extended to:
   * - Write to a database table
   * - Send to an external logging service
   * - Write to a secure audit file
   */
  private logDetail(eventType: string, data: Record<string, any>): void {
    // Structured logging for potential integration with logging services
    const structuredLog = {
      type: eventType,
      ...data,
      environment: this.configService.get<string>('NODE_ENV', 'development')
    };
    
    console.log(JSON.stringify(structuredLog));
    
    // In a production implementation, this could be expanded to:
    // await this.auditLogRepository.save(structuredLog);
  }
} 