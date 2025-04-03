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

## Condition Operators

| Operator | Description | Example Value |
|----------|-------------|---------------|
| `EQUALS` | Value must equal exactly | `"premium"` |
| `NOT_EQUALS` | Value must not equal | `"basic"` |
| `CONTAINS` | String contains substring | `"pro"` |
| `NOT_CONTAINS` | String does not contain substring | `"trial"` |
| `STARTS_WITH` | String starts with prefix | `"premium"` |
| `ENDS_WITH` | String ends with suffix | `"plus"` |
| `GREATER_THAN` | Number is greater than | `100` |
| `LESS_THAN` | Number is less than | `50` |
| `GREATER_THAN_OR_EQUALS` | Number is greater than or equal | `18` |
| `LESS_THAN_OR_EQUALS` | Number is less than or equal | `65` |
| `IN` | Value is in array | `["premium", "enterprise"]` |
| `NOT_IN` | Value is not in array | `["basic", "free"]` |
| `IS_NULL` | Value is null | `null` |
| `IS_NOT_NULL` | Value is not null | `null` |
| `IS_EMPTY` | String is empty or array has zero length | `null` |
| `IS_NOT_EMPTY` | String is not empty or array has elements | `null` |

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