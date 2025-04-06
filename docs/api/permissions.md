# Permissions & Access Control

easyFlags implements a robust, role-based permission system that allows fine-grained access control across all platform features. This document provides a comprehensive reference for the permission system, including available permissions, roles, and API endpoints for permission management.

## Permission Model

The permission system in easyFlags follows these core principles:

1. **Permission Format**: All permissions follow the format `action:resource` (e.g., `view:flags`, `create:users`)
2. **Role-Based Access Control**: Users can be assigned predefined roles with bundled permissions
3. **Direct Permission Assignment**: Individual permissions can be granted directly to users
4. **Tenant Isolation**: Permissions are enforced within tenant boundaries for multi-tenant scenarios
5. **Audit Logging**: All permission changes are recorded for compliance and security

## Available Permissions

Permissions are grouped by resource category:

### Profile & Preferences

| Permission | Description |
|------------|-------------|
| `view:profile` | View own user profile |
| `edit:profile` | Edit own profile details |
| `change:password` | Change own password |
| `view:preferences` | View own user preferences |
| `edit:preferences` | Edit own user preferences |

### Feature Flags

| Permission | Description |
|------------|-------------|
| `view:flags` | View feature flags |
| `create:flags` | Create new feature flags |
| `edit:flags` | Edit existing feature flags |
| `delete:flags` | Delete feature flags |
| `toggle:flags` | Toggle flags on/off |

### Targeting Rules

| Permission | Description |
|------------|-------------|
| `view:rules` | View targeting rules |
| `create:rules` | Create targeting rules |
| `edit:rules` | Edit targeting rules |
| `delete:rules` | Delete targeting rules |

### Flag Versions

| Permission | Description |
|------------|-------------|
| `view:versions` | View flag versions |
| `create:versions` | Create flag versions |
| `rollback:versions` | Rollback to previous versions |

### Tenant Management

| Permission | Description |
|------------|-------------|
| `view:tenants` | View tenants |
| `create:tenants` | Create tenants |
| `edit:tenants` | Edit tenant details |
| `delete:tenants` | Delete tenants |

### User Management

| Permission | Description |
|------------|-------------|
| `view:users` | View users |
| `create:users` | Create users |
| `edit:users` | Edit user details |
| `delete:users` | Delete users |

### API Keys

| Permission | Description |
|------------|-------------|
| `view:apikeys` | View own API keys |
| `create:apikeys` | Create API keys |
| `delete:apikeys` | Delete own API keys |
| `manage:all:apikeys` | Manage all users' API keys |

### Administration

| Permission | Description |
|------------|-------------|
| `assign:permissions` | Assign permissions to users |
| `assign:roles` | Assign roles to users |
| `view:metrics` | View system metrics |
| `copy:flags` | Copy flags between environments |
| `sync:flags` | Sync flags between tenants |
| `super:admin` | Full system access (grants all permissions) |

### Cross-Tenant Operations

| Permission | Description |
|------------|-------------|
| `cross:tenant:view` | View resources across tenants |
| `cross:tenant:edit` | Edit resources across tenants |
| `cross:tenant:admin` | Administrative access across tenants |

## Predefined Roles

easyFlags comes with several predefined roles:

| Role | Description | Key Permissions |
|------|-------------|----------------|
| `reader` | Read-only access to flags and rules | `view:flags`, `view:rules`, `view:versions` |
| `editor` | Can edit flags and rules | Reader permissions + `edit:flags`, `create:rules`, etc. |
| `admin` | Full administrative access | Editor permissions + user management, tenant access |
| `super_admin` | System-wide super user | All permissions via `super:admin` |

## Permission Management API

### Get All Available Permissions

Retrieves a list of all permissions available in the system.

```
GET /api/admin/permissions/all
```

**Required Permissions**: `assign:permissions` or `super:admin`

**Response Example**:

```json
{
  "view:profile": {
    "group": "profile", 
    "description": "View own profile"
  },
  "edit:profile": {
    "group": "profile", 
    "description": "Edit own profile"
  },
  // ... other permissions
}
```

### Get All Roles

Retrieves all roles defined in the system.

```
GET /api/admin/permissions/roles
```

**Required Permissions**: `assign:roles` or `super:admin`

**Response Example**:

```json
{
  "reader": {
    "name": "Reader",
    "description": "Read-only access to flags",
    "permissions": ["view:flags", "view:rules", "view:versions"]
  },
  // ... other roles
}
```

### Get User Permissions

Retrieves all permissions assigned to a specific user.

```
GET /api/admin/permissions/users/:userId
```

**Required Permissions**: `view:users` or `super:admin`

**Response Example**:

```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "editor"
  },
  "permissions": [
    "view:flags",
    "edit:flags",
    "view:rules",
    // ... other permissions
  ],
  "roles": ["editor"]
}
```

### Assign Permissions to User

Assigns specific permissions to a user.

```
POST /api/admin/permissions/assign
```

**Required Permissions**: `assign:permissions` or `super:admin`

**Request Body**:

```json
{
  "userId": "user123",
  "permissions": ["create:flags", "edit:flags", "view:tenants"]
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Permissions assigned successfully",
  "userId": "user123",
  "permissions": ["create:flags", "edit:flags", "view:tenants"]
}
```

### Revoke Permissions from User

Revokes specific permissions from a user.

```
POST /api/admin/permissions/revoke
```

**Required Permissions**: `assign:permissions` or `super:admin`

**Request Body**:

```json
{
  "userId": "user123",
  "permissions": ["edit:flags", "view:tenants"]
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Permissions revoked successfully",
  "userId": "user123",
  "permissions": ["edit:flags", "view:tenants"]
}
```

### Assign Role to User

Assigns a role to a user.

```
POST /api/admin/permissions/users/:userId/roles
```

**Required Permissions**: `assign:roles` or `super:admin`

**Request Body**:

```json
{
  "role": "editor"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Role assigned successfully",
  "userId": "user123",
  "role": "editor"
}
```

### Create or Update Role

Creates a new role or updates an existing one.

```
PUT /api/admin/permissions/roles/:name
```

**Required Permissions**: `assign:roles` or `super:admin`

**Request Body**:

```json
{
  "name": "content_manager",
  "description": "Manages content and flags for marketing",
  "permissions": [
    "view:flags",
    "edit:flags",
    "view:rules",
    "edit:rules"
  ]
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Role updated successfully",
  "role": {
    "name": "content_manager",
    "description": "Manages content and flags for marketing",
    "permissions": [
      "view:flags",
      "edit:flags",
      "view:rules",
      "edit:rules"
    ]
  }
}
```

## Error Handling

Permission-related errors return appropriate HTTP status codes with detailed messages:

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| Permission Denied | 403 | User lacks required permissions |
| User Not Found | 404 | The specified user doesn't exist |
| Invalid Permission | 400 | The permission format is invalid |
| Role Not Found | 404 | The specified role doesn't exist |

**Example Error Response**:

```json
{
  "statusCode": 403,
  "message": "Permission denied",
  "error": "Forbidden",
  "requiredPermissions": ["assign:permissions"]
}
```

## Best Practices

1. **Principle of Least Privilege**: Assign only the permissions users need to perform their job functions
2. **Use Roles**: For common permission sets, create roles instead of assigning individual permissions
3. **Regular Audits**: Periodically review permission assignments to ensure proper access levels
4. **Permission Monitoring**: Monitor for failed permission checks to identify potential security issues
5. **Custom Roles**: Create custom roles tailored to specific business functions rather than using generic roles

## Integration with Authentication

Permission checks are performed after successful authentication. The system uses:

1. A `JwtAuthGuard` to validate the authentication token
2. A `PermissionsGuard` to check if the authenticated user has the required permissions
3. The `@RequirePermissions()` decorator to specify required permissions for endpoints

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.VIEW_FLAGS)
async getFlags() {
  // This endpoint requires 'view:flags' permission
}
``` 