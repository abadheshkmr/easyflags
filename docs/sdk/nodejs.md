# Node.js SDK

The easyFlags Node.js SDK provides a server-side implementation optimized for Node.js applications with high-performance flag evaluation.

## Installation

=== "npm"

    ```bash
    npm install @easyflags/sdk-node
    ```

=== "yarn"

    ```bash
    yarn add @easyflags/sdk-node
    ```

=== "pnpm"

    ```bash
    pnpm add @easyflags/sdk-node
    ```

## Initialization

```javascript
const { FeatureFlagClient } = require('@easyflags/sdk-node');
// Or using ES modules
// import { FeatureFlagClient } from '@easyflags/sdk-node';

// Initialize the client
const client = new FeatureFlagClient({
  apiUrl: 'https://api.easyflags.example.com',
  apiKey: 'your-api-key',
  tenantId: 'your-tenant-id', // Optional for multi-tenant setups
  streaming: true, // Enable WebSocket for real-time updates
  cacheOptions: {
    ttl: 60000, // Cache TTL in milliseconds (default: 60000)
    maxSize: 1000, // Maximum number of items in cache
    dataStore: 'memory' // 'memory', 'redis', or custom store
  }
});

// Initialize the client by fetching flags
await client.initialize();
```

## Using with Redis Cache

For production environments, you can use Redis for distributed caching:

```javascript
const { FeatureFlagClient } = require('@easyflags/sdk-node');
const { RedisStore } = require('@easyflags/sdk-node-redis');

const client = new FeatureFlagClient({
  apiUrl: 'https://api.easyflags.example.com',
  apiKey: 'your-api-key',
  cacheOptions: {
    dataStore: new RedisStore({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'easyflags:',
      ttl: 60000 // 1 minute
    })
  }
});

await client.initialize();
```

## Basic Usage

### Boolean Flags

```javascript
// Check if a feature is enabled
const isEnabled = await client.getBooleanValue(
  'new-feature', // Flag key
  false,         // Default value if flag not found
  {              // Context object for evaluation
    userId: 'user-123',
    userRole: 'premium',
    location: {
      country: 'US'
    }
  }
);

if (isEnabled) {
  // Feature is enabled
} else {
  // Feature is disabled
}
```

### String Flags

```javascript
// Get string variation
const apiVersion = await client.getStringValue(
  'api-version',
  'v1',
  { userId: 'user-123' }
);

// Use the string value
const apiEndpoint = `/api/${apiVersion}/items`;
```

### Number Flags

```javascript
// Get number variation
const cacheTimeout = await client.getNumberValue(
  'cache-timeout',
  3600,
  { userId: 'user-123' }
);

// Use the number value
cache.set('key', value, { ttl: cacheTimeout });
```

### JSON Flags

```javascript
// Get JSON variation
const config = await client.getJsonValue(
  'service-config',
  { retries: 3, timeout: 5000 },
  { userId: 'user-123' }
);

// Use the configuration
initializeService(config);
```

## Performance Optimization

### Local Evaluation

The Node.js SDK supports local evaluation for improved performance:

```javascript
const client = new FeatureFlagClient({
  apiUrl: 'https://api.easyflags.example.com',
  apiKey: 'your-api-key',
  localEvaluation: true // Enable local evaluation
});

// Initialize to download all flag rules
await client.initialize();

// Now evaluations happen locally without API calls
const isEnabled = await client.getBooleanValue('new-feature', false, context);
```

### Batch Evaluation

For optimized performance, you can evaluate multiple flags at once:

```javascript
// Evaluate multiple flags
const results = await client.batchEvaluate(
  ['feature-a', 'feature-b', 'feature-c'],
  { userId: 'user-123', userRole: 'premium' }
);

// Use the results
if (results['feature-a']) {
  // Feature A is enabled
}

if (results['feature-b']) {
  // Feature B is enabled
}
```

### Preloading Flags

Preload all flags at startup to minimize API calls:

```javascript
// During app initialization
await client.initialize({ preloadAll: true });

// Later when flags are needed, they'll be evaluated locally
const isEnabled = await client.getBooleanValue('new-feature', false, context);
```

## Middleware Integration

### Express Middleware

```javascript
const express = require('express');
const { createMiddleware } = require('@easyflags/sdk-node');

const app = express();
const flagClient = new FeatureFlagClient({/* config */});
await flagClient.initialize();

// Add middleware to make flags available in requests
app.use(createMiddleware(flagClient));

// Use in routes
app.get('/api/items', (req, res) => {
  const useNewAlgorithm = req.featureFlags.getBooleanValue(
    'new-search-algorithm', 
    false,
    { userId: req.user.id }
  );
  
  if (useNewAlgorithm) {
    return newSearchService.getItems(req.query);
  } else {
    return legacySearchService.getItems(req.query);
  }
});
```

### Koa Middleware

```javascript
const Koa = require('koa');
const { createKoaMiddleware } = require('@easyflags/sdk-node');

const app = new Koa();
const flagClient = new FeatureFlagClient({/* config */});
await flagClient.initialize();

// Add middleware to make flags available in context
app.use(createKoaMiddleware(flagClient));

// Use in routes
app.use(async (ctx) => {
  const useNewAlgorithm = await ctx.featureFlags.getBooleanValue(
    'new-search-algorithm', 
    false,
    { userId: ctx.state.user.id }
  );
  
  if (useNewAlgorithm) {
    ctx.body = await newSearchService.getItems(ctx.query);
  } else {
    ctx.body = await legacySearchService.getItems(ctx.query);
  }
});
```

## Error Handling

```javascript
try {
  const isEnabled = await client.getBooleanValue('new-feature', false, context);
  // Use the flag value
} catch (error) {
  console.error('Failed to evaluate flag:', error);
  // Fall back to default behavior
}
```

## Subscribing to Flag Changes

The SDK supports real-time updates via WebSockets. You can subscribe to flag changes:

```javascript
// Subscribe to a flag
const unsubscribe = client.subscribe('new-feature', (value) => {
  console.log('Flag value changed:', value);
  // Update your application state
});

// Later, unsubscribe when no longer needed
unsubscribe();
```

## Event Handling

```javascript
// Listen to evaluation events
client.on('evaluation', (event) => {
  console.log('Flag evaluated:', event.key, 'Result:', event.value);
});

// Listen to error events
client.on('error', (error) => {
  console.error('SDK error:', error);
});

// Listen to ready event
client.on('ready', () => {
  console.log('SDK is ready to use');
});
```

## Monitoring & Metrics

The SDK provides built-in metrics that can be exposed to your monitoring system:

```javascript
// Get metrics
const metrics = client.getMetrics();
console.log('Evaluation count:', metrics.evaluationCount);
console.log('Cache hit ratio:', metrics.cacheHitRatio);
console.log('Average evaluation time:', metrics.avgEvaluationTime);

// Export to Prometheus (if you're using prom-client)
const prometheus = require('prom-client');
client.registerPrometheusMetrics(prometheus.register);
```

## Using in Serverless Functions

For serverless environments, optimize initialization to minimize cold starts:

```javascript
// Shared instance outside the handler
const { FeatureFlagClient } = require('@easyflags/sdk-node');
let flagClient;

// Initialize once
async function getClient() {
  if (!flagClient) {
    flagClient = new FeatureFlagClient({
      apiUrl: process.env.FLAGS_API_URL,
      apiKey: process.env.FLAGS_API_KEY,
      bootstrapFile: './flags.json', // Use local file to avoid API call
      localEvaluation: true
    });
    await flagClient.initialize();
  }
  return flagClient;
}

// Lambda handler
exports.handler = async (event, context) => {
  const client = await getClient();
  
  const isFeatureEnabled = await client.getBooleanValue(
    'new-feature',
    false,
    { userId: event.userId }
  );
  
  if (isFeatureEnabled) {
    // New feature code
  } else {
    // Default code
  }
};
```

## Full Example

```javascript
const express = require('express');
const { FeatureFlagClient, createMiddleware } = require('@easyflags/sdk-node');

async function startServer() {
  // Initialize the client
  const client = new FeatureFlagClient({
    apiUrl: 'https://api.easyflags.example.com',
    apiKey: process.env.FLAGS_API_KEY,
    tenantId: process.env.TENANT_ID,
    streaming: true,
    localEvaluation: true,
    cacheOptions: {
      ttl: 300000, // 5 minutes
      dataStore: 'memory'
    }
  });
  
  // Initialize and preload flags
  await client.initialize({ preloadAll: true });
  
  // Subscribe to specific flag changes
  client.subscribe('important-feature', (value) => {
    console.log('Important feature changed:', value);
    // Update application state if needed
  });
  
  // Create Express app with middleware
  const app = express();
  app.use(express.json());
  app.use(createMiddleware(client));
  
  // API routes
  app.get('/api/search', async (req, res) => {
    try {
      const context = {
        userId: req.query.userId || 'anonymous',
        userRole: req.query.role || 'standard',
        location: {
          country: req.headers['x-country'] || 'unknown'
        }
      };
      
      const useNewAlgorithm = await req.featureFlags.getBooleanValue(
        'new-search-algorithm',
        false,
        context
      );
      
      const searchService = useNewAlgorithm ? 
        require('./search/new-algorithm') :
        require('./search/legacy-algorithm');
      
      const results = await searchService.search(req.query.q);
      res.json({ results });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });
  
  // Start server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch(console.error);
``` 