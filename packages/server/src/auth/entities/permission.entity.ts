/**
 * Permission enum for fine-grained access control
 * This extends the basic role-based access with specific permissions
 * that can be assigned to roles or directly to users
 */
export enum Permission {
  // Profile permissions
  VIEW_PROFILE = 'view:profile',
  EDIT_PROFILE = 'edit:profile',
  CHANGE_PASSWORD = 'change:password',
  VIEW_PREFERENCES = 'view:preferences',
  EDIT_PREFERENCES = 'edit:preferences',
  
  // Feature flag permissions
  VIEW_FLAGS = 'view:flags',
  CREATE_FLAGS = 'create:flags',
  UPDATE_FLAGS = 'update:flags',
  DELETE_FLAGS = 'delete:flags',
  TOGGLE_FLAGS = 'toggle:flags',
  
  // Rules permissions
  VIEW_RULES = 'view:rules',
  CREATE_RULES = 'create:rules',
  EDIT_RULES = 'edit:rules',
  DELETE_RULES = 'delete:rules',
  
  // Version permissions
  VIEW_VERSIONS = 'view:versions',
  CREATE_VERSIONS = 'create:versions',
  ROLLBACK_VERSIONS = 'rollback:versions',
  
  // Tenant permissions
  VIEW_TENANTS = 'view:tenants',
  CREATE_TENANTS = 'create:tenants',
  UPDATE_TENANTS = 'edit:tenants',
  DELETE_TENANTS = 'delete:tenants',
  
  // User management permissions
  VIEW_USERS = 'view:users',
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'edit:users',
  DELETE_USERS = 'delete:users',
  
  // API key management permissions
  VIEW_API_KEYS = 'view:apikeys',
  CREATE_API_KEYS = 'create:apikeys',
  DELETE_API_KEYS = 'delete:apikeys',
  REVOKE_API_KEYS = 'revoke:apikeys',
  MANAGE_ALL_API_KEYS = 'manage:all:apikeys',

  // Admin permissions
  ASSIGN_PERMISSIONS = 'assign:permissions',
  ASSIGN_ROLES = 'assign:roles',
  COPY_FLAGS = 'copy:flags',
  SYNC_FLAGS = 'sync:flags',
  VIEW_METRICS = 'view:metrics',

  // Cross-tenant permissions (for SaaS admin users)
  CROSS_TENANT_VIEW = 'cross:tenant:view',
  CROSS_TENANT_EDIT = 'cross:tenant:edit',
  CROSS_TENANT_ADMIN = 'cross:tenant:admin',
  
  // System permissions
  SUPER_ADMIN = 'super:admin'
} 