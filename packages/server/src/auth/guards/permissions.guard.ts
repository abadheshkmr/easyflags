import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';
import { PermissionConfigService } from '../config/permission-config.service';

/**
 * Guard that checks if the user has the required permissions
 * Works with the RequirePermissions decorator
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);
  
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private permissionConfigService: PermissionConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator or route metadata
    const requiredPermissions = this.getRequiredPermissions(context);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No specific permissions required for this route
      return true;
    }
    
    // Get the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Ensure user is authenticated
    if (!user || !user.sub) {
      this.logger.warn('Permission check failed: No authenticated user');
      throw new ForbiddenException({
        message: 'Authentication required',
        error: 'Permission denied',
        requiredPermissions,
      });
    }
    
    // Check if the user has all required permissions
    const hasPermission = await this.permissionService.hasPermissions(
      user.sub,
      requiredPermissions
    );
    
    if (!hasPermission) {
      this.logger.warn(`Permission denied: User lacks required permissions [${requiredPermissions.join(', ')}]`);
      throw new ForbiddenException({
        message: `You don't have the required permissions (${requiredPermissions.join(', ')}) to access this resource`,
        error: 'Permission denied',
        requiredPermissions,
      });
    }
    
    // User has required permissions
    return true;
  }
  
  /**
   * Get required permissions for the current route
   * This will check decorator metadata, or infer based on controller/method
   */
  private getRequiredPermissions(context: ExecutionContext): string[] {
    // First check for explicit permissions from decorator
    const explicitPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    ) || this.reflector.get<string[]>(
      'permissions',
      context.getClass()
    );
    
    if (explicitPermissions) {
      return explicitPermissions;
    }
    
    // If no explicit permissions, try to infer from route
    const request = context.switchToHttp().getRequest();
    const controller = context.getClass().name;
    const method = request.method;
    const path = request.route?.path;
    
    // Use the permission config service to determine required permissions
    return this.permissionConfigService.getRequiredPermissionsForOperation(
      controller,
      method,
      path
    );
  }
} 