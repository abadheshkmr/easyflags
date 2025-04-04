import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
    const user: UserEntity = request.user;

    if (!user) {
      return false;
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some(permission => user.hasPermission(permission));
  }
} 