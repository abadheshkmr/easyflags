# Feature Flag Evaluation Flow

This sequence diagram illustrates the process of evaluating a feature flag, from client request through the SDK to the backend service.

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant SDK as JavaScript SDK
    participant Backend as Backend Server
    participant DB as Database
    participant Cache as Redis Cache
    
    Client->>SDK: Initialize with tenant ID
    SDK->>Backend: Authenticate (JWT)
    Backend->>SDK: Return auth token
    
    Client->>SDK: evaluateFlag("my-flag", context)
    
    alt Local Cache Hit
        SDK->>SDK: Return cached value
    else Cache Miss
        SDK->>Backend: GET /api/v1/evaluation/my-flag
        Backend->>Cache: Check cache
        
        alt Cache Hit
            Cache->>Backend: Return cached result
        else Cache Miss
            Backend->>DB: Query flag definition
            DB->>Backend: Return flag data
            Backend->>Backend: Apply rules to context
            Backend->>Cache: Store result
        end
        
        Backend->>SDK: Return evaluation result
        SDK->>SDK: Store in local cache
    end
    
    SDK->>Client: Return flag value
    
    Backend->>SDK: WebSocket notification of flag change
    SDK->>SDK: Invalidate cache
```

## Evaluation Process Details

1. **SDK Initialization**: The client initializes the SDK with tenant ID and optional configuration
2. **Authentication**: The SDK authenticates with the backend to obtain a valid token
3. **Local Caching**: SDKs maintain a local cache to minimize network requests 
4. **Context-based Evaluation**: Flag values can vary based on user context (user ID, attributes, etc.)
5. **Multi-level Caching**: The system uses both client-side and server-side caching
6. **Real-time Updates**: WebSocket connections notify clients when flag configurations change
7. **Fallback Values**: SDKs provide default values in case of network failures 