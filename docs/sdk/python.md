# Python SDK

The easyFlags Python SDK provides a server-side implementation for evaluating feature flags in Python applications.

## Installation

```bash
pip install easyflags-sdk
```

## Initialization

```python
from easyflags import FeatureFlagClient

# Initialize the client
client = FeatureFlagClient(
    api_url="https://api.easyflags.example.com",
    api_key="your-api-key",
    tenant_id="your-tenant-id",  # Optional for multi-tenant setups
    streaming=True,  # Enable WebSocket for real-time updates
    cache_options={
        "ttl": 60000,  # Cache TTL in milliseconds
        "max_size": 1000,  # Maximum number of items in cache
        "data_store": "memory"  # 'memory', 'redis', or custom store
    }
)

# Initialize the client by fetching flags
await client.initialize()
```

## Using with Redis Cache

For production environments, you can use Redis for distributed caching:

```python
from easyflags import FeatureFlagClient
from easyflags.stores import RedisStore

# Initialize with Redis store
client = FeatureFlagClient(
    api_url="https://api.easyflags.example.com",
    api_key="your-api-key",
    cache_options={
        "data_store": RedisStore(
            host="localhost",
            port=6379,
            key_prefix="easyflags:",
            ttl=60000  # 1 minute
        )
    }
)

# Initialize the client
await client.initialize()
```

## Basic Usage

### Boolean Flags

```python
# Check if a feature is enabled
is_enabled = await client.get_boolean_value(
    "new-feature",  # Flag key
    False,          # Default value if flag not found
    {               # Context object for evaluation
        "userId": "user-123",
        "userRole": "premium",
        "location": {
            "country": "US"
        }
    }
)

if is_enabled:
    # Feature is enabled
    print("Feature is enabled")
else:
    # Feature is disabled
    print("Feature is disabled")
```

### String Flags

```python
# Get string variation
api_version = await client.get_string_value(
    "api-version",
    "v1",
    {"userId": "user-123"}
)

# Use the string value
api_endpoint = f"/api/{api_version}/items"
```

### Number Flags

```python
# Get number variation
cache_timeout = await client.get_number_value(
    "cache-timeout",
    3600,
    {"userId": "user-123"}
)

# Use the number value
cache.set("key", value, ttl=cache_timeout)
```

### JSON Flags

```python
# Get JSON variation
config = await client.get_json_value(
    "service-config",
    {"retries": 3, "timeout": 5000},
    {"userId": "user-123"}
)

# Use the configuration
initialize_service(**config)
```

## Performance Optimization

### Local Evaluation

The Python SDK supports local evaluation for improved performance:

```python
client = FeatureFlagClient(
    api_url="https://api.easyflags.example.com",
    api_key="your-api-key",
    local_evaluation=True  # Enable local evaluation
)

# Initialize to download all flag rules
await client.initialize()

# Now evaluations happen locally without API calls
is_enabled = await client.get_boolean_value("new-feature", False, context)
```

### Batch Evaluation

For optimized performance, you can evaluate multiple flags at once:

```python
# Evaluate multiple flags
results = await client.batch_evaluate(
    ["feature-a", "feature-b", "feature-c"],
    {"userId": "user-123", "userRole": "premium"}
)

# Use the results
if results.get("feature-a"):
    # Feature A is enabled
    pass

if results.get("feature-b"):
    # Feature B is enabled
    pass
```

### Preloading Flags

Preload all flags at startup to minimize API calls:

```python
# During app initialization
await client.initialize(preload_all=True)

# Later when flags are needed, they'll be evaluated locally
is_enabled = await client.get_boolean_value("new-feature", False, context)
```

## Web Framework Integration

### FastAPI Integration

```python
from fastapi import FastAPI, Depends, Request
from easyflags import FeatureFlagClient
from easyflags.integrations.fastapi import FeatureFlagMiddleware, get_feature_flags

app = FastAPI()
flag_client = FeatureFlagClient(
    api_url="https://api.easyflags.example.com",
    api_key="your-api-key"
)

# Initialize during startup
@app.on_event("startup")
async def startup_event():
    await flag_client.initialize()

# Add middleware to make flags available in requests
app.add_middleware(FeatureFlagMiddleware, client=flag_client)

# Use in routes with dependency injection
@app.get("/api/items")
async def get_items(
    request: Request,
    feature_flags=Depends(get_feature_flags)
):
    context = {
        "userId": request.query_params.get("userId", "anonymous"),
        "userRole": request.query_params.get("role", "standard")
    }
    
    use_new_algorithm = await feature_flags.get_boolean_value(
        "new-search-algorithm",
        False,
        context
    )
    
    if use_new_algorithm:
        # Use new search algorithm
        return {"items": await new_search_service.get_items(request.query_params)}
    else:
        # Use legacy search algorithm
        return {"items": await legacy_search_service.get_items(request.query_params)}
```

### Flask Integration

```python
from flask import Flask, request, g
from easyflags import FeatureFlagClient
from easyflags.integrations.flask import feature_flags_middleware

app = Flask(__name__)
flag_client = FeatureFlagClient(
    api_url="https://api.easyflags.example.com",
    api_key="your-api-key"
)

# Initialize the client
@app.before_first_request
def initialize_flags():
    await flag_client.initialize()

# Add middleware to make flags available in requests
app.before_request(feature_flags_middleware(flag_client))

# Use in routes
@app.route("/api/items")
def get_items():
    context = {
        "userId": request.args.get("userId", "anonymous"),
        "userRole": request.args.get("role", "standard")
    }
    
    use_new_algorithm = g.feature_flags.get_boolean_value(
        "new-search-algorithm",
        False,
        context
    )
    
    if use_new_algorithm:
        # Use new search algorithm
        return {"items": new_search_service.get_items(request.args)}
    else:
        # Use legacy search algorithm
        return {"items": legacy_search_service.get_items(request.args)}
```

## Error Handling

```python
try:
    is_enabled = await client.get_boolean_value("new-feature", False, context)
    # Use the flag value
except Exception as error:
    print(f"Failed to evaluate flag: {error}")
    # Fall back to default behavior
    is_enabled = False
```

## Subscribing to Flag Changes

The SDK supports real-time updates via WebSockets. You can subscribe to flag changes:

```python
# Subscribe to a flag
async def handle_flag_change(value):
    print(f"Flag value changed: {value}")
    # Update your application state

unsubscribe = client.subscribe("new-feature", handle_flag_change)

# Later, unsubscribe when no longer needed
unsubscribe()
```

## Event Handling

```python
# Listen to evaluation events
async def on_evaluation(event):
    print(f"Flag evaluated: {event['key']}, Result: {event['value']}")

# Listen to error events
async def on_error(error):
    print(f"SDK error: {error}")

# Listen to ready event
async def on_ready():
    print("SDK is ready to use")

client.on("evaluation", on_evaluation)
client.on("error", on_error)
client.on("ready", on_ready)
```

## Monitoring & Metrics

The SDK provides built-in metrics that can be exposed to your monitoring system:

```python
# Get metrics
metrics = client.get_metrics()
print(f"Evaluation count: {metrics['evaluation_count']}")
print(f"Cache hit ratio: {metrics['cache_hit_ratio']}")
print(f"Average evaluation time: {metrics['avg_evaluation_time']}")

# Export to Prometheus (if you're using prometheus_client)
from prometheus_client import Counter, Gauge
client.register_prometheus_metrics()
```

## Async and Sync API

The SDK provides both async and sync APIs:

```python
# Async API (preferred for async applications)
async def async_example():
    is_enabled = await client.get_boolean_value("feature", False, context)
    return is_enabled

# Sync API (for synchronous applications)
def sync_example():
    is_enabled = client.get_boolean_value_sync("feature", False, context)
    return is_enabled
```

## Full Example

```python
import asyncio
from fastapi import FastAPI, Depends, Request
from easyflags import FeatureFlagClient
from easyflags.integrations.fastapi import FeatureFlagMiddleware, get_feature_flags

# Initialize the feature flag client
async def initialize_flags():
    client = FeatureFlagClient(
        api_url="https://api.easyflags.example.com",
        api_key="your-api-key",
        tenant_id="your-tenant-id",
        streaming=True,
        local_evaluation=True,
        cache_options={
            "ttl": 300000,  # 5 minutes
            "data_store": "memory"
        }
    )
    
    # Initialize and preload flags
    await client.initialize(preload_all=True)
    
    # Subscribe to specific flag changes
    async def handle_important_feature(value):
        print(f"Important feature changed: {value}")
        # Update application state if needed
    
    client.subscribe("important-feature", handle_important_feature)
    
    return client

# Create FastAPI app
app = FastAPI()

# Initialize client during startup
@app.on_event("startup")
async def startup_event():
    app.state.flag_client = await initialize_flags()
    # Add middleware to make flags available in requests
    app.add_middleware(
        FeatureFlagMiddleware,
        client=app.state.flag_client
    )

# Define routes
@app.get("/api/search")
async def search(
    request: Request,
    q: str,
    feature_flags=Depends(get_feature_flags)
):
    try:
        # Create context from request
        context = {
            "userId": request.query_params.get("userId", "anonymous"),
            "userRole": request.query_params.get("role", "standard"),
            "location": {
                "country": request.headers.get("x-country", "unknown")
            }
        }
        
        # Evaluate feature flag
        use_new_algorithm = await feature_flags.get_boolean_value(
            "new-search-algorithm",
            False,
            context
        )
        
        # Use appropriate search service
        if use_new_algorithm:
            from search.new_algorithm import search as search_function
        else:
            from search.legacy_algorithm import search as search_function
        
        # Perform search
        results = await search_function(q)
        return {"results": results}
    
    except Exception as error:
        print(f"Search error: {error}")
        return {"error": "Search failed"}, 500

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 