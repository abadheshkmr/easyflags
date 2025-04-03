# React SDK

The easyFlags React SDK provides a set of hooks and components for easily integrating feature flags into your React applications.

## Installation

=== "npm"

    ```bash
    npm install @easyflags/sdk-react
    ```

=== "yarn"

    ```bash
    yarn add @easyflags/sdk-react
    ```

=== "pnpm"

    ```bash
    pnpm add @easyflags/sdk-react
    ```

## Setup

Wrap your application with the `FeatureFlagProvider` to initialize the SDK:

```jsx
import { FeatureFlagProvider } from '@easyflags/sdk-react';

function App() {
  return (
    <FeatureFlagProvider
      apiUrl="https://api.easyflags.example.com"
      apiKey="your-api-key"
      tenantId="your-tenant-id" // Optional for multi-tenant setups
      options={{
        streaming: true, // Enable WebSocket for real-time updates
        cacheOptions: {
          persistToLocalStorage: true
        }
      }}
    >
      <YourApp />
    </FeatureFlagProvider>
  );
}
```

## Basic Usage

### useFeatureFlag Hook

The primary way to use feature flags in your components:

```jsx
import { useFeatureFlag } from '@easyflags/sdk-react';

function MyComponent() {
  // For boolean flags
  const isNewFeatureEnabled = useFeatureFlag('new-feature', false, {
    userId: 'user-123',
    userRole: 'premium'
  });

  return (
    <div>
      {isNewFeatureEnabled ? (
        <NewFeatureComponent />
      ) : (
        <LegacyComponent />
      )}
    </div>
  );
}
```

### Type-Specific Hooks

The SDK provides typed hooks for different flag types:

```jsx
import {
  useBooleanFlag,
  useStringFlag,
  useNumberFlag,
  useJsonFlag
} from '@easyflags/sdk-react';

function MyComponent() {
  // Boolean flag
  const isEnabled = useBooleanFlag('new-feature', false);
  
  // String flag
  const theme = useStringFlag('theme', 'light');
  
  // Number flag
  const maxItems = useNumberFlag('max-items', 10);
  
  // JSON flag
  const config = useJsonFlag('api-config', { timeout: 3000 });
  
  return (
    <div className={theme}>
      {isEnabled && <NewFeature config={config} />}
      <ItemList maxItems={maxItems} />
    </div>
  );
}
```

## Feature Flag Components

### FeatureFlag Component

Conditionally render content based on a feature flag:

```jsx
import { FeatureFlag } from '@easyflags/sdk-react';

function MyComponent() {
  return (
    <div>
      <FeatureFlag
        flagKey="new-feature"
        defaultValue={false}
        context={{ userId: 'user-123' }}
      >
        {(isEnabled) => (
          isEnabled ? <NewFeature /> : <LegacyFeature />
        )}
      </FeatureFlag>
    </div>
  );
}
```

### When Component

Declaratively control rendering based on feature flags:

```jsx
import { When } from '@easyflags/sdk-react';

function MyComponent() {
  return (
    <div>
      <When
        flagKey="new-feature"
        isEnabled={true}
        context={{ userId: 'user-123' }}
      >
        <NewFeature />
      </When>
      
      <When
        flagKey="new-feature"
        isEnabled={false}
        context={{ userId: 'user-123' }}
      >
        <LegacyFeature />
      </When>
    </div>
  );
}
```

## User Context

### Using the useContext Hook

```jsx
import { useContext, useFeatureFlag } from '@easyflags/sdk-react';

function MyComponent() {
  // Set the user context once for all flag evaluations in the component
  const { setContext } = useContext();
  
  useEffect(() => {
    setContext({
      userId: user.id,
      userRole: user.role,
      location: {
        country: user.country
      }
    });
  }, [user, setContext]);
  
  // No need to pass context to individual hooks as it's set globally
  const isFeatureEnabled = useFeatureFlag('new-feature', false);
  
  return (
    <div>
      {isFeatureEnabled && <NewFeature />}
    </div>
  );
}
```

### Using the Context Provider

```jsx
import { ContextProvider } from '@easyflags/sdk-react';

function UserArea({ user }) {
  const context = {
    userId: user.id,
    userRole: user.role,
    location: {
      country: user.country
    }
  };

  return (
    <ContextProvider value={context}>
      {/* All child components will use this context */}
      <Dashboard />
      <UserProfile />
      <Settings />
    </ContextProvider>
  );
}
```

## Loading States

The SDK provides a hook to check if flags are still loading:

```jsx
import { useFeatureFlag, useFlags } from '@easyflags/sdk-react';

function MyComponent() {
  const { isLoading } = useFlags();
  const isFeatureEnabled = useFeatureFlag('new-feature', false);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      {isFeatureEnabled && <NewFeature />}
    </div>
  );
}
```

## Real-time Updates

Hooks automatically react to flag changes over WebSocket:

```jsx
import { useFeatureFlag } from '@easyflags/sdk-react';

function MyComponent() {
  // This will automatically re-render when the flag changes
  const isFeatureEnabled = useFeatureFlag('new-feature', false);
  
  return (
    <div>
      {isFeatureEnabled && <NewFeature />}
    </div>
  );
}
```

## Accessing the Client Directly

For advanced use cases, you can access the underlying client:

```jsx
import { useClient } from '@easyflags/sdk-react';

function MyComponent() {
  const client = useClient();
  
  const handleBatchOperation = async () => {
    // Evaluate multiple flags at once for better performance
    const results = await client.batchEvaluate(
      ['feature-a', 'feature-b', 'feature-c'],
      { userId: 'user-123' }
    );
    
    // Use the results
    console.log(results);
  };
  
  return (
    <button onClick={handleBatchOperation}>
      Perform Batch Operation
    </button>
  );
}
```

## Testing with the SDK

### With React Testing Library

```jsx
import { render, screen } from '@testing-library/react';
import { FeatureFlagProvider } from '@easyflags/sdk-react';

// Mock provider for tests
function renderWithFlags(ui, mockFlags = {}) {
  return render(
    <FeatureFlagProvider
      apiUrl="fake-url"
      apiKey="fake-key"
      mockFlags={mockFlags} // Will use these values instead of API calls
    >
      {ui}
    </FeatureFlagProvider>
  );
}

test('renders new feature when flag is enabled', () => {
  renderWithFlags(<MyComponent />, {
    'new-feature': true
  });
  
  expect(screen.getByTestId('new-feature')).toBeInTheDocument();
});

test('renders legacy feature when flag is disabled', () => {
  renderWithFlags(<MyComponent />, {
    'new-feature': false
  });
  
  expect(screen.getByTestId('legacy-feature')).toBeInTheDocument();
});
```

## Complete Example

```jsx
import React from 'react';
import {
  FeatureFlagProvider,
  useBooleanFlag,
  useStringFlag,
  ContextProvider
} from '@easyflags/sdk-react';

// Top-level App with provider
function App({ user }) {
  return (
    <FeatureFlagProvider
      apiUrl="https://api.easyflags.example.com"
      apiKey="your-api-key"
      options={{ streaming: true }}
    >
      <ContextProvider 
        value={{ 
          userId: user.id, 
          userRole: user.role 
        }}
      >
        <Header />
        <MainContent />
        <Footer />
      </ContextProvider>
    </FeatureFlagProvider>
  );
}

// Component using feature flags
function MainContent() {
  const newDashboard = useBooleanFlag('new-dashboard', false);
  const theme = useStringFlag('color-theme', 'light');
  
  return (
    <main className={`theme-${theme}`}>
      {newDashboard ? (
        <NewDashboard />
      ) : (
        <LegacyDashboard />
      )}
    </main>
  );
}

export default App;
``` 