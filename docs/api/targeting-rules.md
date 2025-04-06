# Targeting Rules API

This section documents the API endpoints for managing targeting rules for feature flags.

## Targeting Rule Object

```json
{
  "id": "r8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "Premium Users",
  "description": "Enable for premium users",
  "featureFlagId": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "percentage": 100,
  "enabled": true,
  "conditions": [
    {
      "id": "c8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "attribute": "userRole",
      "operator": "EQUALS",
      "value": "premium"
    }
  ],
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:00:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

## Endpoints

### List Targeting Rules for a Flag

```
GET /feature-flags/{flagId}/targeting-rules
```

#### Response

```json
{
  "data": [
    {
      "id": "r8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "name": "Premium Users",
      "description": "Enable for premium users",
      "featureFlagId": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "percentage": 100,
      "enabled": true,
      "conditions": [
        {
          "id": "c8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
          "attribute": "userRole",
          "operator": "EQUALS",
          "value": "premium"
        }
      ],
      "createdAt": "2023-06-01T12:00:00Z",
      "updatedAt": "2023-06-01T12:00:00Z"
    },
    // ...more targeting rules
  ]
}
```

### Get a Specific Targeting Rule

```
GET /feature-flags/{flagId}/targeting-rules/{id}
```

#### Response

```json
{
  "id": "r8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "Premium Users",
  "description": "Enable for premium users",
  "featureFlagId": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "percentage": 100,
  "enabled": true,
  "conditions": [
    {
      "id": "c8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "attribute": "userRole",
      "operator": "EQUALS",
      "value": "premium"
    }
  ],
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:00:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

### Create a Targeting Rule

```
POST /feature-flags/{flagId}/targeting-rules
```

#### Request Body

```json
{
  "name": "Premium Users",
  "description": "Enable for premium users",
  "percentage": 100,
  "enabled": true,
  "conditions": [
    {
      "attribute": "userRole",
      "operator": "EQUALS",
      "value": "premium"
    }
  ]
}
```

#### Response

```json
{
  "id": "r8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "Premium Users",
  "description": "Enable for premium users",
  "featureFlagId": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "percentage": 100,
  "enabled": true,
  "conditions": [
    {
      "id": "c8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "attribute": "userRole",
      "operator": "EQUALS",
      "value": "premium"
    }
  ],
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:00:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

### Update a Targeting Rule

```
PATCH /feature-flags/{flagId}/targeting-rules/{id}
```

#### Request Body

```json
{
  "name": "Updated Rule Name",
  "percentage": 50,
  "conditions": [
    {
      "attribute": "userRole",
      "operator": "EQUALS",
      "value": "premium"
    },
    {
      "attribute": "country",
      "operator": "IN",
      "value": ["US", "CA", "UK"]
    }
  ]
}
```

#### Response

```json
{
  "id": "r8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "name": "Updated Rule Name",
  "description": "Enable for premium users",
  "featureFlagId": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
  "percentage": 50,
  "enabled": true,
  "conditions": [
    {
      "id": "c8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "attribute": "userRole",
      "operator": "EQUALS",
      "value": "premium"
    },
    {
      "id": "d8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
      "attribute": "country",
      "operator": "IN",
      "value": ["US", "CA", "UK"]
    }
  ],
  "createdAt": "2023-06-01T12:00:00Z",
  "updatedAt": "2023-06-01T12:05:00Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

### Delete a Targeting Rule

```
DELETE /feature-flags/{flagId}/targeting-rules/{id}
```

#### Response

```
Status: 204 No Content
```

## Code Examples

### JavaScript

```javascript
// Create a targeting rule
const response = await fetch(`https://api.easyflags.example.com/feature-flags/${flagId}/targeting-rules`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'x-tenant-id': 'YOUR_TENANT_ID'
  },
  body: JSON.stringify({
    name: 'Beta Users in US',
    description: 'Target beta users in the United States',
    percentage: 50,
    enabled: true,
    conditions: [
      {
        attribute: 'userRole',
        operator: 'EQUALS',
        value: 'beta'
      },
      {
        attribute: 'location.country',
        operator: 'EQUALS',
        value: 'US'
      }
    ]
  })
});

const rule = await response.json();
console.log(rule);
```

### Python

```python
import requests

# Create a targeting rule
response = requests.post(
    f'https://api.easyflags.example.com/feature-flags/{flag_id}/targeting-rules',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'x-tenant-id': 'YOUR_TENANT_ID'
    },
    json={
        'name': 'Beta Users in US',
        'description': 'Target beta users in the United States',
        'percentage': 50,
        'enabled': True,
        'conditions': [
            {
                'attribute': 'userRole',
                'operator': 'EQUALS',
                'value': 'beta'
            },
            {
                'attribute': 'location.country',
                'operator': 'EQUALS',
                'value': 'US'
            }
        ]
    }
)

rule = response.json()
print(rule)
``` 