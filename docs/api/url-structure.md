# API URL Structure

This document outlines the standardized URL structure for all API endpoints in the EasyFlags service.

## Base Structure

All API endpoints follow this consistent pattern:

```
https://{domain}/api/v{version}/{resource-category}/{resource}/{action}
```

### Components

- **domain**: The server domain (e.g., localhost:3000)
- **api**: Fixed prefix for all API endpoints
- **version**: API version number (e.g., v1, v2)
- **resource-category**: Logical grouping of related resources
- **resource**: The primary resource being accessed
- **action**: Optional specific operation on a resource

## Resource Categories

The API is organized into these main categories:

1. **admin**: Administrative operations
   ```
   /api/v1/admin/tenants
   /api/v1/admin/users
   /api/v1/admin/flags
   /api/v1/admin/permissions
   ```

2. **auth**: Authentication and authorization
   ```
   /api/v1/auth/login
   /api/v1/auth/token
   /api/v1/auth/register
   ```

3. **flags**: Feature flag management
   ```
   /api/v1/flags
   /api/v1/flags/{id}
   /api/v1/flags/{key}/toggle
   ```

4. **tenants**: Tenant management
   ```
   /api/v1/tenants
   /api/v1/tenants/{id}
   ```

5. **evaluation**: Flag evaluation
   ```
   /api/v1/evaluation/{key}
   /api/v1/evaluation/batch
   ```

6. **monitoring**: Health and diagnostics
   ```
   /api/v1/monitoring/health
   /api/v1/monitoring/metrics
   ```

7. **permissions**: Permission management
   ```
   /api/v1/admin/permissions/all
   /api/v1/admin/permissions/roles
   /api/v1/admin/permissions/users/{userId}
   ```

## Resource Naming Conventions

- Resources are named using plural nouns (flags, tenants, users)
- Multi-word resources use kebab-case (feature-flags, api-keys)
- Actions use verbs (toggle, activate, clone)

## HTTP Methods

The API uses standard HTTP methods to represent operations:

- **GET**: Retrieve resources
- **POST**: Create new resources or perform complex operations
- **PUT**: Update resources completely
- **PATCH**: Update resources partially
- **DELETE**: Remove resources

## Example Endpoints

| Operation | Method | Endpoint | Required Permission |
|-----------|--------|----------|-------------------|
| List all flags | GET | `/api/v1/flags` | `view:flags` |
| Get flag by ID | GET | `/api/v1/flags/{id}` | `view:flags` |
| Get flag by key | GET | `/api/v1/flags/key/{key}` | `view:flags` |
| Create a new flag | POST | `/api/v1/flags` | `create:flags` |
| Update a flag | PUT | `/api/v1/flags/{id}` | `edit:flags` |
| Toggle a flag | PATCH | `/api/v1/flags/{key}/toggle` | `toggle:flags` |
| Delete a flag | DELETE | `/api/v1/flags/{id}` | `delete:flags` |
| Evaluate a flag | POST | `/api/v1/evaluation/{key}` | API key access |
| Authenticate | POST | `/api/v1/auth/token` | No permission required |
| System health check | GET | `/api/v1/monitoring/health` | No permission required |
| List all permissions | GET | `/api/v1/admin/permissions/all` | `assign:permissions` or `super:admin` |
| Get user permissions | GET | `/api/v1/admin/permissions/users/{userId}` | `view:users` or `super:admin` |
| Assign permissions | POST | `/api/v1/admin/permissions/assign` | `assign:permissions` or `super:admin` |

## Headers

All API requests should include these headers when applicable:

- **Authorization**: `Bearer {token}` for authentication
- **X-Tenant-ID**: The tenant identifier for multi-tenant operations
- **Content-Type**: `application/json` for request bodies 

## Permission Requirements

All API endpoints (except authentication and certain public endpoints) require specific permissions to access. If a request lacks the required permissions, the API will return a 403 Forbidden response with details about the missing permissions.

For a complete list of permission requirements for each endpoint, see the [Permissions & Access Control](permissions.md) documentation. 