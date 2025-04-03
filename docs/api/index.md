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
| 401 | Unauthorized |
| 403 | Forbidden |
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feature-flags` | List all feature flags |
| GET | `/feature-flags/{id}` | Get a feature flag by ID |
| GET | `/feature-flags/key/{key}` | Get a feature flag by key |
| POST | `/feature-flags` | Create a new feature flag |
| PATCH | `/feature-flags/{id}` | Update a feature flag |
| PATCH | `/feature-flags/key/{key}` | Update a feature flag by key |
| DELETE | `/feature-flags/{id}` | Delete a feature flag |

### Targeting Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feature-flags/{flagId}/targeting-rules` | List targeting rules for a flag |
| GET | `/feature-flags/{flagId}/targeting-rules/{id}` | Get a targeting rule |
| POST | `/feature-flags/{flagId}/targeting-rules` | Create a targeting rule |
| PATCH | `/feature-flags/{flagId}/targeting-rules/{id}` | Update a targeting rule |
| DELETE | `/feature-flags/{flagId}/targeting-rules/{id}` | Delete a targeting rule |

### Evaluation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/evaluate/{key}` | Evaluate a single flag |
| POST | `/api/v1/evaluate/batch` | Batch evaluate multiple flags |

Detailed documentation for each endpoint is available in the subsequent pages. 