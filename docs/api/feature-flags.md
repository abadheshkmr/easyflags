# Feature Flags API

This section documents the API endpoints for managing feature flags.

## Feature Flag Object

```json
{
  "id": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "New Search Algorithm",
  "key": "new-search-algorithm",
  "description": "Enables the new search algorithm with improved relevance",
  "enabled": true,
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:00:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

## Endpoints

### List All Feature Flags

```
GET /feature-flags
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Filter flags by tenant ID |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20) |

#### Response

```json
{
  "data": [
    {
      "id": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "name": "New Search Algorithm",
      "key": "new-search-algorithm",
      "description": "Enables the new search algorithm with improved relevance",
      "enabled": true,
      "tenantId": "123e4567-e89b-12d3-a456-426614174000",
      "createdAt": "2023-06-01T12:00:00Z",
      "updatedAt": "2023-06-01T12:00:00Z"
    },
    // ...more flags
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### Get a Specific Feature Flag

```
GET /feature-flags/{id}
```

#### Response

```json
{
  "id": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "New Search Algorithm",
  "key": "new-search-algorithm",
  "description": "Enables the new search algorithm with improved relevance",
  "enabled": true,
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:00:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123",
  "targetingRules": [
    // associated targeting rules (if requested)
  ]
}
```

### Get a Feature Flag by Key

```
GET /feature-flags/key/{key}
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Required tenant ID |

#### Response

Same as the response for GET /feature-flags/{id}

### Create a Feature Flag

```
POST /feature-flags
```

#### Request Body

```json
{
  "name": "New Search Algorithm",
  "key": "new-search-algorithm",
  "description": "Enables the new search algorithm with improved relevance",
  "enabled": false,
  "tenantId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Response

```json
{
  "id": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "New Search Algorithm",
  "key": "new-search-algorithm",
  "description": "Enables the new search algorithm with improved relevance",
  "enabled": false,
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:00:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

### Update a Feature Flag

```
PATCH /feature-flags/{id}
```

#### Request Body

```json
{
  "name": "Updated Search Algorithm",
  "description": "Updated description",
  "enabled": true
}
```

#### Response

```json
{
  "id": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "Updated Search Algorithm",
  "key": "new-search-algorithm",
  "description": "Updated description",
  "enabled": true,
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:05:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

### Update a Feature Flag by Key

```
PATCH /feature-flags/key/{key}
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Required tenant ID |

#### Request Body

Same as PATCH /feature-flags/{id}

#### Response

Same as the response for PATCH /feature-flags/{id}

### Delete a Feature Flag

```
DELETE /feature-flags/{id}
```

#### Response

```
Status: 204 No Content
```

## Code Examples

### JavaScript

```javascript
// Create a feature flag
const response = await fetch('https://api.easyflags.example.com/feature-flags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'x-tenant-id': 'YOUR_TENANT_ID'
  },
  body: JSON.stringify({
    name: 'New Feature',
    key: 'new-feature',
    description: 'A new feature being tested',
    enabled: false
  })
});

const flag = await response.json();
console.log(flag);
```

### Python

```python
import requests

# Create a feature flag
response = requests.post(
    'https://api.easyflags.example.com/feature-flags',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'x-tenant-id': 'YOUR_TENANT_ID'
    },
    json={
        'name': 'New Feature',
        'key': 'new-feature',
        'description': 'A new feature being tested',
        'enabled': False
    }
)

flag = response.json()
print(flag)
``` 