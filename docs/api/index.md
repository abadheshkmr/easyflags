# API Reference

easyFlags provides a comprehensive REST API for managing feature flags, targeting rules, and flag evaluation. This section documents all available endpoints and how to use them.

## Base URL

```
https://api.easyflags.example.com
```

For self-hosted installations, use your own domain.

## Authentication

All API requests require authentication. easyFlags supports two authentication methods:

### JWT Bearer Token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key

```http
Authorization: ApiKey your-api-key
```

### Tenant Identification

For multi-tenant installations, include the tenant ID in the `x-tenant-id` header:

```http
x-tenant-id: 123e4567-e89b-12d3-a456-426614174000
```

## Authorization

easyFlags implements a comprehensive permission system that governs access to all resources. Each API endpoint requires specific permissions to access. These permissions follow the format `action:resource` (e.g., `view:flags`, `create:users`).

When a request lacks the required permissions, the API returns a 403 Forbidden error with details about the missing permissions:

```json
{
  "statusCode": 403,
  "message": "Permission denied",
  "error": "Forbidden",
  "requiredPermissions": ["create:flags"]
}
```

For detailed information about permissions, see [Permissions & Access Control](permissions.md).

## Response Format

All responses are returned in JSON format:

```json
{
  "data": { ... },  // The response data
  "meta": { ... }   // Metadata about the response (pagination, etc.)
}
```

## Error Handling

Errors follow a standard format:

```json
{
  "statusCode": 400,
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

Common HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (invalid or missing authentication) |
| 403 | Forbidden (missing required permissions) |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limits

API endpoints are rate limited to prevent abuse:

- **Standard endpoints**: 1000 requests per minute per tenant
- **Evaluation endpoints**: 10,000 requests per minute per tenant

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1623456789
```

## API Versioning

The API is versioned through the URL path:

```
/api/v1/...
```

## Available Endpoints

### Feature Flags

| Method | Endpoint | Description | Required Permissions |
|--------|----------|-------------|---------------------|
| GET | `/feature-flags` | List all feature flags | `view:flags` |
| GET | `/feature-flags/{id}` | Get a feature flag by ID | `view:flags` |
| GET | `/feature-flags/key/{key}` | Get a feature flag by key | `view:flags` |
| POST | `/feature-flags` | Create a new feature flag | `create:flags` |
| PATCH | `/feature-flags/{id}` | Update a feature flag | `edit:flags` |
| PATCH | `/feature-flags/key/{key}` | Update a feature flag by key | `edit:flags` |
| DELETE | `/feature-flags/{id}` | Delete a feature flag | `delete:flags` |

### Targeting Rules

| Method | Endpoint | Description | Required Permissions |
|--------|----------|-------------|---------------------|
| GET | `/feature-flags/{flagId}/targeting-rules` | List targeting rules for a flag | `view:rules` |
| GET | `/feature-flags/{flagId}/targeting-rules/{id}` | Get a targeting rule | `view:rules` |
| POST | `/feature-flags/{flagId}/targeting-rules` | Create a targeting rule | `create:rules` |
| PATCH | `/feature-flags/{flagId}/targeting-rules/{id}` | Update a targeting rule | `edit:rules` |
| DELETE | `/feature-flags/{flagId}/targeting-rules/{id}` | Delete a targeting rule | `delete:rules` |

### Permission Management

| Method | Endpoint | Description | Required Permissions |
|--------|----------|-------------|---------------------|
| GET | `/admin/permissions/all` | List all available permissions | `assign:permissions` or `super:admin` |
| GET | `/admin/permissions/roles` | List all roles | `assign:roles` or `super:admin` |
| GET | `/admin/permissions/users/{userId}` | Get permissions for a user | `view:users` or `super:admin` |
| POST | `/admin/permissions/assign` | Assign permissions to a user | `assign:permissions` or `super:admin` |
| POST | `/admin/permissions/revoke` | Revoke permissions from a user | `assign:permissions` or `super:admin` |
| POST | `/admin/permissions/users/{userId}/roles` | Assign a role to a user | `assign:roles` or `super:admin` |
| PUT | `/admin/permissions/roles/{name}` | Create or update a role | `assign:roles` or `super:admin` |

### Evaluation

| Method | Endpoint | Description | Required Permissions |
|--------|----------|-------------|---------------------|
| POST | `/api/v1/evaluate/{key}` | Evaluate a single flag | API key access only |
| POST | `/api/v1/evaluate/batch` | Batch evaluate multiple flags | API key access only |

Detailed documentation for each endpoint is available in the subsequent pages. 