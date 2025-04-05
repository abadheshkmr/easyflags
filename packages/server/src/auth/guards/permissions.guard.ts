import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../entities/permission.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserEntity } from '../entities/user.entity';

/**
 * Guard that checks if the user has the required permissions
 * Works with the RequirePermissions decorator
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { url, method } = request;
    const tenantId = request.headers['x-tenant-id'] || 'global';

    if (!user) {
      this.logger.warn(
        `Permission check failed: No user found | Path: ${method} ${url} | Tenant: ${tenantId}`
      );
      return false;
    }

    // Safely check if the user has any of the required permissions
    const hasPermission = this.checkUserPermissions(user, requiredPermissions);
    
    if (!hasPermission) {
      const permissionsStr = requiredPermissions.join(', ');
      this.logger.warn(
        `Permission denied: User ${user.id} lacks required permissions [${permissionsStr}] | ` +
        `Path: ${method} ${url} | Tenant: ${tenantId}`
      );
      
      throw new ForbiddenException(
        `You don't have the required permissions (${permissionsStr}) to access this resource`
      );
    }
    
    this.logger.debug(
      `Permission granted: User ${user.id} has required permissions | Path: ${method} ${url} | Tenant: ${tenantId}`
    );

    return true;
  }

  /**
   * Safely check if a user has any of the required permissions
   * Handles both UserEntity objects and plain user objects
   */
  private checkUserPermissions(user: any, requiredPermissions: Permission[]): boolean {
    // If the user is a UserEntity with hasPermission method, use it
    if (user.hasPermission && typeof user.hasPermission === 'function') {
      return requiredPermissions.some(permission => user.hasPermission(permission));
    }
    
    // For regular users, super admin role overrides permission checks
    if (user.role === 'ADMIN' || user.role === 'admin') {
      return true;
    }
    
    // Check direct permissions if available
    if (user.directPermissions && Array.isArray(user.directPermissions)) {
      return requiredPermissions.some(permission => 
        user.directPermissions.includes(permission)
      );
    }
    
    // Check roles-based permissions if available
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles) {
        if (role.permissions && Array.isArray(role.permissions)) {
          if (requiredPermissions.some(permission => role.permissions.includes(permission))) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
} 