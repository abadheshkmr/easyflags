import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../entities/permission.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserEntity } from '../entities/user.entity';

/**
 * Guard that checks if the user has cross-tenant access
 * Either through explicit cross-tenant permissions or by belonging to the requested tenant
 */
@Injectable()
export class CrossTenantGuard implements CanActivate {
  private readonly logger = new Logger(CrossTenantGuard.name);
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { url, method } = request;
    
    if (!user) {
      this.logger.warn(
        `Cross-tenant check failed: No user found | Path: ${method} ${url}`
      );
      return false;
    }
    
    // Get the requested tenant ID (from request headers, params, or query)
    const requestedTenantId = 
      request.headers['x-tenant-id'] || 
      request.params.tenantId || 
      request.query.tenantId;
    
    if (!requestedTenantId) {
      this.logger.debug(
        `No tenant ID specified in request | User: ${user.id} | Path: ${method} ${url}`
      );
      return true; // No tenant ID specified, regular permissions apply
    }
    
    // If the user belongs to the requested tenant, allow access
    if (user.tenantId === requestedTenantId) {
      this.logger.debug(
        `User ${user.id} accessing their own tenant ${requestedTenantId} | Path: ${method} ${url}`
      );
      return true;
    }
    
    // Check if user has cross-tenant permissions
    const hasCrossTenant = this.checkCrossTenantAccess(user);
    
    if (!hasCrossTenant) {
      this.logger.warn(
        `Cross-tenant access denied: User ${user.id} from tenant ${user.tenantId} ` +
        `attempted to access tenant ${requestedTenantId} | Path: ${method} ${url}`
      );
      
      throw new ForbiddenException(
        `You don't have permission to access resources from tenant ${requestedTenantId}`
      );
    }
    
    this.logger.log(
      `Cross-tenant access granted: User ${user.id} accessing tenant ${requestedTenantId} | Path: ${method} ${url}`
    );
    
    return true;
  }

  /**
   * Safely check if a user has cross-tenant access
   * Handles both UserEntity objects and plain user objects
   */
  private checkCrossTenantAccess(user: any): boolean {
    // If the user is a UserEntity with hasCrossTenantAccess method, use it
    if (user.hasCrossTenantAccess && typeof user.hasCrossTenantAccess === 'function') {
      return user.hasCrossTenantAccess();
    }
    
    // For regular users, check if they have admin role
    if (user.role === 'ADMIN' || user.role === 'admin') {
      return true;
    }

    // Check direct permissions if available
    const crossTenantPermissions = [
      Permission.CROSS_TENANT_VIEW,
      Permission.CROSS_TENANT_EDIT,
      Permission.CROSS_TENANT_ADMIN,
      Permission.SUPER_ADMIN
    ];
    
    if (user.directPermissions && Array.isArray(user.directPermissions)) {
      if (crossTenantPermissions.some(permission => user.directPermissions.includes(permission))) {
        return true;
      }
    }
    
    // Check roles-based permissions if available
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles) {
        if (role.permissions && Array.isArray(role.permissions)) {
          if (crossTenantPermissions.some(permission => role.permissions.includes(permission))) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
} 