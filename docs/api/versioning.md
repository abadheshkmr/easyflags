# API Versioning

## Current Status

The easyFlags API currently uses implicit versioning rather than explicit URL path versioning. While the documentation references paths like `/api/v1/...`, the actual implementation delivers all endpoints directly under the `/api/` path without version segments.

This status is indicated during server startup with the message:
```
📜 API Versioning : Disabled
```

## Expected URL Structure

Despite the disabled versioning in URLs, the API is designed with future versioning in mind. The documentation shows the intended structure for when versioning is enabled:

```
https://{domain}/api/v{version}/{resource-category}/{resource}/{action}
```

## Working with the Current Implementation

When making API requests, you should:

1. **Omit the version segment** from your URLs:
   - ✅ Use: `/api/flags`
   - ❌ Not: `/api/v1/flags`

2. **Follow documentation examples** which may show versioned paths but implement the functionality without the version segment.

3. **Check the response headers** for API version information, which may be included even without URL versioning.

## Future Plans

The API is designed to support explicit versioning in the future. When this feature is enabled:

1. Existing endpoints will be accessible at their versioned paths (`/api/v1/...`)
2. New API versions will be introduced at higher version paths (`/api/v2/...`)
3. The server will notify clients of this change through appropriate headers

## Implementation Details

The versioning mechanism is configured in the server's main bootstrap file (`main.ts`) but is currently commented out:

```typescript
// Currently disabled
// app.enableVersioning({
//   type: VersioningType.URI,
//   defaultVersion: '1',
//   prefix: 'api/v',
// });
```

When this configuration is enabled, all endpoints will be properly versioned in the URL path. 