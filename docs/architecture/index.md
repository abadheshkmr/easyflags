# Architecture Overview

easyFlags is designed as a high-performance, multi-tenant feature flag service with a focus on ultra-low latency evaluation. This page provides an overview of the system architecture and components.

## System Architecture

```mermaid
graph TD
    A[Client Applications] --> B[SDK]
    B <--> C[API Gateway]
    C --> D[API Service]
    C --> E[Evaluation Service]
    D <--> F[(Database)]
    E <--> G[(Redis Cache)]
    E <--> F
    D <--> H[WebSocket Gateway]
    H <--> B
    
    classDef primary fill:#4051b5,stroke:#4051b5,color:white
    classDef secondary fill:#7986cb,stroke:#7986cb,color:white
    classDef storage fill:#616161,stroke:#616161,color:white
    
    class A,B primary
    class C,D,E,H secondary
    class F,G storage
```

## Key Components

easyFlags consists of several key components, each with a specific role in the system:

### Client-Side Components

- **SDK**: Client libraries for different languages that provide feature flag evaluation, caching, and real-time updates
- **WebSocket Client**: Establishes persistent connection for real-time flag updates

### Server-Side Components

- **API Gateway**: Routes requests to appropriate services and handles authentication/authorization
- **API Service**: Manages feature flags, targeting rules, and other configuration data
- **Evaluation Service**: High-performance evaluation engine optimized for sub-10ms response times
- **WebSocket Gateway**: Provides real-time flag updates to connected clients
- **Redis Cache**: In-memory cache for flag definitions and evaluation results
- **Database**: Persistent storage for feature flags, targeting rules, and audit logs

## Data Flow

### Evaluation Flow

```mermaid
sequenceDiagram
    participant Client
    participant SDK
    participant API
    participant Cache
    participant DB
    
    Client->>SDK: checkFlag("feature", context)
    
    alt Local cache hit
        SDK-->>Client: Return cached result
    else Local cache miss
        SDK->>API: POST /api/v1/evaluate/feature
        
        API->>Cache: Check Redis cache
        
        alt Redis cache hit
            Cache-->>API: Return cached result
        else Redis cache miss
            API->>DB: Query flag definition
            DB-->>API: Return flag data
            API->>API: Evaluate rules
            API->>Cache: Store result
        end
        
        API-->>SDK: Return evaluation result
        SDK->>SDK: Update local cache
        SDK-->>Client: Return result
    end
```

### Flag Update Flow

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant DB
    participant EventBus
    participant WebSocket
    participant Client
    
    Admin->>API: Update flag
    API->>DB: Save changes
    DB-->>API: Success
    API->>EventBus: Publish flag changed event
    EventBus->>WebSocket: Notify of flag change
    WebSocket->>Client: Flag changed notification
    Client->>Client: Invalidate cache
    Client->>API: Request updated flag
    API-->>Client: Return updated flag
```

## Class Diagram

```mermaid
classDiagram
    class FeatureFlag {
        +String id
        +String name
        +String key
        +Boolean enabled
        +String tenantId
        +DateTime createdAt
        +create()
        +update()
        +delete()
    }
    
    class TargetingRule {
        +String id
        +String featureFlagId
        +String name
        +Number percentage
        +Boolean enabled
        +evaluate(context)
    }
    
    class Condition {
        +String id
        +String targetingRuleId
        +String attribute
        +String operator
        +Any value
        +matches(context)
    }
    
    class EvaluationService {
        +evaluateFlag(key, context)
        +batchEvaluate(keys, context)
        -getFlagDefinition(key)
        -evaluateFlagRules(flag, context)
        -matchesRule(rule, context)
    }
    
    FeatureFlag "1" *-- "many" TargetingRule
    TargetingRule "1" *-- "many" Condition
    EvaluationService --> FeatureFlag : evaluates
```

## Deployment Architecture

easyFlags can be deployed in various configurations depending on your requirements:

```mermaid
graph TD
    subgraph "Self-Hosted"
        A[Docker Compose] --> B[Single Server]
        C[Kubernetes] --> D[Clustered]
    end
    
    subgraph "Managed Service"
        E[AWS] --> F[Auto-scaling]
        G[GCP] --> H[Multi-region]
    end
    
    classDef primary fill:#4051b5,stroke:#4051b5,color:white
    classDef secondary fill:#7986cb,stroke:#7986cb,color:white
    
    class A,C,E,G primary
    class B,D,F,H secondary
```

In the next sections, we'll dive deeper into each component of the architecture. 