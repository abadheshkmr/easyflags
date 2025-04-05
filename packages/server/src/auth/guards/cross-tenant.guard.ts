import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: UserEntity = request.user;
    
    if (!user) {
      return false;
    }
    
    // Get the requested tenant ID (from request headers, params, or query)
    const requestedTenantId = 
      request.headers['x-tenant-id'] || 
      request.params.tenantId || 
      request.query.tenantId;
    
    if (!requestedTenantId) {
      return true; // No tenant ID specified, regular permissions apply
    }
    
    // If the user belongs to the requested tenant, allow access
    if (user.tenantId === requestedTenantId) {
      return true;
    }
    
    // Check if user has cross-tenant permissions
    return user.hasCrossTenantAccess();
  }
} 