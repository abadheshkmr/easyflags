import { Injectable } from '@nestjs/common';

export type PermissionGroup = 'profile' | 'apikeys' | 'flags' | 'tenants' | 'admin' | 'users' | 'system';

export interface PermissionDefinition {
  group: PermissionGroup;
  description: string;
}

export interface RolePermissionMapping {
  name: string;
  description: string;
  permissions: string[];
}

@Injectable()
export class PermissionConfigService {
  // Define all available permissions in a single place, categorized by API endpoint
  private readonly allPermissions: Record<string, PermissionDefinition> = {
    // Profile permissions
    'view:profile': { group: 'profile', description: 'View own profile' },
    'edit:profile': { group: 'profile', description: 'Edit own profile' },
    'change:password': { group: 'profile', description: 'Change own password' },
    
    // User preference permissions
    'view:preferences': { group: 'profile', description: 'View own preferences' },
    'edit:preferences': { group: 'profile', description: 'Edit own preferences' },
    
    // API key permissions
    'view:apikeys': { group: 'apikeys', description: 'View own API keys' },
    'create:apikeys': { group: 'apikeys', description: 'Create API keys' },
    'delete:apikeys': { group: 'apikeys', description: 'Delete own API keys' },
    'manage:all:apikeys': { group: 'apikeys', description: 'Manage all users\' API keys' },
    
    // Feature flag permissions
    'view:flags': { group: 'flags', description: 'View feature flags' },
    'create:flags': { group: 'flags', description: 'Create feature flags' },
    'edit:flags': { group: 'flags', description: 'Edit feature flags' },
    'delete:flags': { group: 'flags', description: 'Delete feature flags' },
    'toggle:flags': { group: 'flags', description: 'Toggle feature flags' },
    
    // Flag rule permissions
    'view:rules': { group: 'flags', description: 'View targeting rules' },
    'create:rules': { group: 'flags', description: 'Create targeting rules' },
    'edit:rules': { group: 'flags', description: 'Edit targeting rules' },
    'delete:rules': { group: 'flags', description: 'Delete targeting rules' },
    
    // Flag version permissions
    'view:versions': { group: 'flags', description: 'View flag versions' },
    'create:versions': { group: 'flags', description: 'Create flag versions' },
    'rollback:versions': { group: 'flags', description: 'Rollback to previous versions' },
    
    // Tenant permissions
    'view:tenants': { group: 'tenants', description: 'View tenants' },
    'create:tenants': { group: 'tenants', description: 'Create tenants' },
    'edit:tenants': { group: 'tenants', description: 'Edit tenants' },
    'delete:tenants': { group: 'tenants', description: 'Delete tenants' },
    
    // User management permissions
    'view:users': { group: 'users', description: 'View users' },
    'edit:users': { group: 'users', description: 'Edit users' },
    'create:users': { group: 'users', description: 'Create users' },
    'delete:users': { group: 'users', description: 'Delete users' },
    
    // Admin permissions
    'assign:permissions': { group: 'admin', description: 'Assign permissions to users' },
    'assign:roles': { group: 'admin', description: 'Assign roles to users' },
    'copy:flags': { group: 'admin', description: 'Copy flags between tenants' },
    'sync:flags': { group: 'admin', description: 'Sync flags between tenants' },
    'view:metrics': { group: 'admin', description: 'View system metrics' },
    
    // Super admin permission
    'super:admin': { group: 'system', description: 'Full system access' },
  };
  
  // Role definitions with associated permissions
  private readonly roleDefinitions: Record<string, RolePermissionMapping> = {
    'user': {
      name: 'Regular User',
      description: 'Standard user with basic permissions',
      permissions: [
        'view:profile', 'edit:profile', 'change:password',
        'view:preferences', 'edit:preferences',
        'view:apikeys', 'create:apikeys', 'delete:apikeys',
        'view:flags'
      ],
    },
    'flag_manager': {
      name: 'Flag Manager',
      description: 'User who can manage feature flags',
      permissions: [
        'view:profile', 'edit:profile', 'change:password',
        'view:preferences', 'edit:preferences',
        'view:apikeys', 'create:apikeys', 'delete:apikeys',
        'view:flags', 'create:flags', 'edit:flags', 'delete:flags', 'toggle:flags',
        'view:rules', 'create:rules', 'edit:rules', 'delete:rules',
        'view:versions', 'create:versions', 'rollback:versions'
      ],
    },
    'tenant_manager': {
      name: 'Tenant Manager',
      description: 'User who can manage tenants',
      permissions: [
        'view:profile', 'edit:profile', 'change:password', 
        'view:preferences', 'edit:preferences',
        'view:apikeys', 'create:apikeys', 'delete:apikeys',
        'view:flags', 'create:flags', 'edit:flags', 'delete:flags', 'toggle:flags',
        'view:rules', 'create:rules', 'edit:rules', 'delete:rules',
        'view:versions', 'create:versions', 'rollback:versions',
        'view:tenants', 'create:tenants', 'edit:tenants'
      ],
    },
    'admin': {
      name: 'Administrator',
      description: 'Administrator with access to user management',
      permissions: [
        'view:profile', 'edit:profile', 'change:password',
        'view:preferences', 'edit:preferences', 
        'view:apikeys', 'create:apikeys', 'delete:apikeys', 'manage:all:apikeys',
        'view:flags', 'create:flags', 'edit:flags', 'delete:flags', 'toggle:flags',
        'view:rules', 'create:rules', 'edit:rules', 'delete:rules',
        'view:versions', 'create:versions', 'rollback:versions',
        'view:tenants', 'create:tenants', 'edit:tenants', 'delete:tenants',
        'view:users', 'edit:users', 'view:metrics',
        'copy:flags', 'sync:flags'
      ],
    },
    'super_admin': {
      name: 'Super Administrator',
      description: 'Super administrator with full system access',
      permissions: ['super:admin'], // Special permission that grants all access
    },
  };
  
  // Get all available permissions
  getAllPermissions(): Record<string, PermissionDefinition> {
    return this.allPermissions;
  }
  
  // Get permissions for a specific role
  getPermissionsForRole(role: string): string[] {
    const roleDef = this.roleDefinitions[role] || this.roleDefinitions['user'];
    
    // Special case for super_admin
    if (role === 'super_admin' || roleDef.permissions.includes('super:admin')) {
      return Object.keys(this.allPermissions);
    }
    
    return roleDef.permissions;
  }
  
  // Get all role definitions
  getAllRoleDefinitions(): Record<string, RolePermissionMapping> {
    return this.roleDefinitions;
  }
  
  // Check if a permission exists
  isValidPermission(permission: string): boolean {
    return !!this.allPermissions[permission];
  }
  
  // Get permission details by name
  getPermissionDetails(permission: string): PermissionDefinition | undefined {
    return this.allPermissions[permission];
  }
  
  // Get permissions by group
  getPermissionsByGroup(group: PermissionGroup): string[] {
    return Object.entries(this.allPermissions)
      .filter(([_, details]) => details.group === group)
      .map(([permission, _]) => permission);
  }

  // Check if a specific permission is required for an operation
  getRequiredPermissionsForOperation(controller: string, method: string, path: string): string[] {
    // Default for operations that don't need special permissions
    const defaultPermissions: Record<string, string[]> = {
      'UserController': [
        'view:profile',  // GET /users/me
        'edit:profile',  // PUT /users/me
        'change:password', // PATCH /users/me/password
        'view:preferences', // GET /users/me/preferences
        'edit:preferences', // PATCH /users/me/preferences
      ],
      'ApiKeyController': [
        'view:apikeys',   // GET /users/me/apikeys
        'create:apikeys', // POST /users/me/apikeys
        'delete:apikeys', // DELETE /users/me/apikeys/:id
      ],
      'AdminApiKeyController': [
        'manage:all:apikeys', // All operations
      ],
      'FeatureFlagController': [
        'view:flags',   // GET operations
        'create:flags', // POST operations
        'edit:flags',   // PUT operations
        'delete:flags', // DELETE operations
        'toggle:flags', // PATCH operations with 'toggle'
      ],
      'TenantController': [
        'view:tenants',   // GET operations
        'create:tenants', // POST operations
        'edit:tenants',   // PUT operations
        'delete:tenants', // DELETE operations
      ],
      'AdminController': [
        'super:admin', // Default for admin operations
      ],
    };

    if (controller === 'AdminController') {
      if (path.includes('/tenants/') && method === 'GET') {
        return ['view:tenants'];
      } else if (path.includes('/flags/copy')) {
        return ['copy:flags', 'super:admin'];
      } else if (path.includes('/flags/sync')) {
        return ['sync:flags', 'super:admin'];
      }
    }

    return defaultPermissions[controller] || ['super:admin'];
  }
} 