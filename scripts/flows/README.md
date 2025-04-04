# Flow Testing Scripts

This directory contains test scripts that validate the different flows of the EasyFlags system according to the system design diagrams.

## Available Tests

1. **System Overview Test** (`test-system-overview.js`)
   - Tests all major components: Backend Server, Database, Redis Cache, WebSocket Server, Authentication, and Flag Evaluation
   - Verifies that all components are properly integrated

2. **Flag Evaluation Flow Test** (`test-flag-evaluation.js`)
   - Tests the flag evaluation process from SDK initialization to result
   - Verifies caching behavior and WebSocket notifications

3. **Tenant Provisioning Test** (`test-tenant-provisioning.js`)
   - Tests creating new tenants and setting up their environment
   - Verifies tenant isolation and data separation

4. **Multi-Tenant Architecture Test** (`test-multi-tenant-architecture.js`)
   - Tests handling multiple concurrent tenants
   - Verifies data isolation and cross-tenant admin operations

5. **Admin Workflow Test** (`test-admin-workflow.js`)
   - Tests the admin UI backend APIs
   - Verifies tenant, flag, and user management operations

## Running the Tests

### Prerequisites

Before running the tests, make sure:

1. The feature flag service is running (`cd packages/server && yarn start:local`)
2. PostgreSQL and Redis are running
3. Required Node.js packages are installed

### Install Dependencies

```bash
npm install axios ws uuid pg redis
```

### Running All Tests

```bash
node scripts/flows/index.js
```

### Running a Specific Test

```bash
node scripts/flows/index.js system-overview
node scripts/flows/index.js flag-evaluation
node scripts/flows/index.js tenant-provisioning
node scripts/flows/index.js multi-tenant-architecture
node scripts/flows/index.js admin-workflow
```

### Running Tests Directly

You can also run each test script directly:

```bash
node scripts/flows/test-system-overview.js
```

## Environment Variables

The test scripts support the following environment variables:

- `API_URL`: URL of the API server (default: http://localhost:3000)
- `REDIS_URL`: URL of the Redis server (default: redis://localhost:6379)
- `PG_CONNECTION`: PostgreSQL connection string
- `API_KEY`: Default API key for testing
- `TENANT_ID`: Default tenant ID for testing
- `ADMIN_TOKEN`: Admin token for testing admin operations
- `ADMIN_EMAIL`: Admin email for login tests
- `ADMIN_PASSWORD`: Admin password for login tests

Example:

```bash
API_URL=http://localhost:3000 API_KEY=your-api-key TENANT_ID=test-tenant node scripts/flows/test-flag-evaluation.js
```

## Test Output

Each test provides detailed output of the operations it's performing and their results, with clear success/failure indicators. The index script provides a summary of all test results when running multiple tests. 