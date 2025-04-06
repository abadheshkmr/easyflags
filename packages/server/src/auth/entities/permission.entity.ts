/**
 * Permission enum for fine-grained access control
 * This extends the basic role-based access with specific permissions
 * that can be assigned to roles or directly to users
 */
export enum Permission {
  // Feature flag permissions
  VIEW_FLAGS = 'view:flags',
  CREATE_FLAGS = 'create:flags',
  UPDATE_FLAGS = 'update:flags',
  DELETE_FLAGS = 'delete:flags',
  
  // Tenant permissions
  VIEW_TENANTS = 'view:tenants',
  CREATE_TENANTS = 'create:tenants',
  UPDATE_TENANTS = 'update:tenants',
  DELETE_TENANTS = 'delete:tenants',
  
  // User management permissions
  VIEW_USERS = 'view:users',
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // API key management permissions
  VIEW_API_KEYS = 'view:apikeys',
  CREATE_API_KEYS = 'create:apikeys',
  REVOKE_API_KEYS = 'revoke:apikeys',
  MANAGE_ALL_API_KEYS = 'manage:all:apikeys',

  // Cross-tenant permissions (for SaaS admin users)
  CROSS_TENANT_VIEW = 'cross:tenant:view',
  CROSS_TENANT_EDIT = 'cross:tenant:edit',
  CROSS_TENANT_ADMIN = 'cross:tenant:admin',
  
  // System permissions
  SUPER_ADMIN = 'super:admin'
} 