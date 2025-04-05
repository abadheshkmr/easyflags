# Multi-Tenant Architecture

This diagram shows how the feature flag service handles multiple tenants, ensuring proper isolation and security between different clients.

```mermaid
graph TD
    subgraph "Client Applications"
        TenantA["Tenant A App"]
        TenantB["Tenant B App"]
        TenantC["Tenant C App"]
    end
    
    subgraph "Backend Services"
        API["API Gateway"]
        Auth["Auth Service"]
        FlagService["Feature Flag Service"]
        TenantService["Tenant Service"]
        
        subgraph "Data Storage"
            DB[(PostgreSQL with RLS)]
            Cache[(Redis Cache)]
        end
    end
    
    TenantA -->|Requests with<br>Tenant ID| API
    TenantB -->|Requests with<br>Tenant ID| API
    TenantC -->|Requests with<br>Tenant ID| API
    
    API -->|Authenticate| Auth
    Auth -->|Validate Tenant| TenantService
    API -->|Forward Request| FlagService
    
    FlagService -->|Query with Tenant Context| DB
    FlagService -->|Cache Results| Cache
    
    style DB fill:#d9b3ff
    style API fill:#b3d9ff
    style FlagService fill:#b3d9ff
    style Auth fill:#ffcc99
    style TenantService fill:#ffcc99
```

## Multi-Tenant Implementation Details

- **Tenant Identification**: Each request includes a tenant identifier (either in headers, JWT token, or URL)
- **Row-Level Security (RLS)**: Database-level isolation ensures tenants can only access their own data
- **Tenant Middleware**: NestJS middleware validates and enforces tenant context on all requests
- **Isolated Caching**: Cache keys include tenant identifiers to prevent cross-tenant data leakage
- **Cross-Tenant Administration**: Admin users with special permissions can manage multiple tenants 