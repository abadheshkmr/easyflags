# System Overview

This diagram illustrates the high-level architecture of the feature flag service, showing the main components and their interactions.

```mermaid
graph TD
    subgraph "Feature Flag Service"
        Server["Backend Server (NestJS)"]
        AdminUI["Admin UI (React)"]
        DB[(PostgreSQL Database)]
        Redis[(Redis Cache)]
        WSS[WebSocket Server]
        
        subgraph "SDKs"
            JS_SDK["JavaScript SDK"]
            React_SDK["React SDK"]
        end
    end
    
    subgraph "Client Applications"
        SaaS_App["SaaS Application"]
        AdminUser["Admin User"]
    end
    
    AdminUser -->|Manages Flags| AdminUI
    AdminUI -->|API Calls| Server
    Server -->|Stores Data| DB
    Server -->|Caches Evaluations| Redis
    Server -->|Broadcasts Changes| WSS
    SaaS_App -->|Evaluates Flags| JS_SDK
    SaaS_App -->|React Components| React_SDK
    JS_SDK -->|API Requests| Server
    JS_SDK -->|Real-time Updates| WSS
    React_SDK -->|Uses| JS_SDK
    
    style Server fill:#b3d9ff
    style AdminUI fill:#ffcc99
    style DB fill:#d9b3ff
    style Redis fill:#ffb3b3
    style WSS fill:#b3ffb3
```

## Key Components

- **Backend Server (NestJS)**: Core service that handles all feature flag logic
- **Admin UI (React)**: Web interface for managing feature flags and tenants
- **PostgreSQL Database**: Persistent storage for all feature flags and tenant data
- **Redis Cache**: High-performance cache for flag evaluations
- **WebSocket Server**: Enables real-time updates when flag configurations change
- **SDKs**: Client libraries for JavaScript and React applications to consume the service 