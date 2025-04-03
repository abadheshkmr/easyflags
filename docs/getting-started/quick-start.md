# Quick Start

This guide will help you set up and start using easyFlags in your application in just a few minutes.

## Prerequisites

- An easyFlags account
- Your API key
- Your application codebase ready for integration

## Step 1: Install the SDK

Choose the SDK for your platform and install it:

=== "JavaScript/TypeScript"

    ```bash
    npm install @easyflags/sdk-js
    ```

=== "React"

    ```bash
    npm install @easyflags/sdk-react
    ```

=== "Node.js"

    ```bash
    npm install @easyflags/sdk-node
    ```

=== "Python"

    ```bash
    pip install easyflags-sdk
    ```

## Step 2: Initialize the Client

Initialize the easyFlags client in your application:

=== "JavaScript/TypeScript"

    ```javascript
    import { FeatureFlagClient } from '@easyflags/sdk-js';

    const client = new FeatureFlagClient({
      apiUrl: 'https://api.easyflags.example.com',
      apiKey: 'your-api-key',
      streaming: true // Enable WebSocket for real-time updates
    });

    // Initialize the client
    await client.initialize();
    ```

=== "React"

    ```jsx
    import { FeatureFlagProvider } from '@easyflags/sdk-react';

    function App() {
      return (
        <FeatureFlagProvider
          apiUrl="https://api.easyflags.example.com"
          apiKey="your-api-key"
        >
          <YourApplication />
        </FeatureFlagProvider>
      );
    }
    ```

=== "Node.js"

    ```javascript
    const { FeatureFlagClient } = require('@easyflags/sdk-node');

    const client = new FeatureFlagClient({
      apiUrl: 'https://api.easyflags.example.com',
      apiKey: 'your-api-key',
      localEvaluation: true // Enable local evaluation for faster performance
    });

    // Initialize the client
    await client.initialize();
    ```

=== "Python"

    ```python
    from easyflags import FeatureFlagClient

    client = FeatureFlagClient(
        api_url="https://api.easyflags.example.com",
        api_key="your-api-key",
        streaming=True
    )

    # Initialize the client
    await client.initialize()
    ```

## Step 3: Create a Feature Flag

Create a feature flag in the easyFlags dashboard:

1. Log in to your easyFlags dashboard
2. Navigate to your project
3. Click "Create Flag"
4. Set the following properties:
   - **Key**: `new-feature` (used in code to reference this flag)
   - **Name**: "New Feature"
   - **Description**: "Enables the new feature in our application"
   - **Type**: Boolean
   - **Default Value**: false

## Step 4: Use the Feature Flag

Now use the feature flag in your code:

=== "JavaScript/TypeScript"

    ```javascript
    // Create a user context
    const context = {
      userId: 'user-123',
      userRole: 'premium',
      location: {
        country: 'US'
      }
    };

    // Evaluate the flag
    const isEnabled = await client.getBooleanValue(
      'new-feature', // The flag key
      false,         // Default value if flag not found
      context        // The user context
    );

    // Use the flag value
    if (isEnabled) {
      // Show the new feature
      showNewFeature();
    } else {
      // Show the existing experience
      showExistingExperience();
    }
    ```

=== "React"

    ```jsx
    import { useBooleanFlag } from '@easyflags/sdk-react';

    function MyComponent() {
      const isNewFeatureEnabled = useBooleanFlag(
        'new-feature',
        false,
        { userId: 'user-123', userRole: 'premium' }
      );

      return (
        <div>
          {isNewFeatureEnabled ? (
            <NewFeatureComponent />
          ) : (
            <ExistingComponent />
          )}
        </div>
      );
    }
    ```

=== "Node.js"

    ```javascript
    // Create a user context
    const context = {
      userId: 'user-123',
      userRole: 'admin',
      location: {
        country: 'US'
      }
    };

    // Evaluate the flag
    const isEnabled = await client.getBooleanValue(
      'new-feature',
      false,
      context
    );

    // Use the flag value
    if (isEnabled) {
      return newApiResponse();
    } else {
      return existingApiResponse();
    }
    ```

=== "Python"

    ```python
    # Create a user context
    context = {
        "userId": "user-123",
        "userRole": "premium",
        "location": {
            "country": "US"
        }
    }

    # Evaluate the flag
    is_enabled = await client.get_boolean_value(
        "new-feature",
        False,
        context
    )

    # Use the flag value
    if is_enabled:
        # Show the new feature
        show_new_feature()
    else:
        # Show the existing experience
        show_existing_experience()
    ```

## Step 5: Test the Feature Flag

To test your feature flag:

1. In the easyFlags dashboard, toggle the flag on for a specific target audience
2. For example, enable it only for users with the role "premium"
3. Test your application with different user contexts to verify the flag behaves as expected

## Step 6: Implement Targeting Rules

Configure advanced targeting rules:

1. In the dashboard, navigate to your flag
2. Add a targeting rule:
   - **Name**: "Premium Users"
   - **Rule**: `userRole = "premium"`
   - **Serve**: true (enabled)
3. Add another rule:
   - **Name**: "US Beta Testers"
   - **Rule**: `location.country = "US" AND userTags CONTAINS "beta-tester"`
   - **Serve**: true (enabled)
4. Set the default rule to serve "false" (disabled) for everyone else

## Step 7: Enable Percentage Rollout

For gradual rollout:

1. Edit your flag settings
2. For a specific rule, set a percentage rollout:
   - **Rule**: `true` (matches everyone)
   - **Percentage**: 10%
   - This enables the feature for only 10% of users
3. Increase the percentage over time to gradually roll out to more users

## Next Steps

Congratulations! You've successfully integrated easyFlags into your application. To learn more:

- Explore [SDK documentation](../sdk/index.md) for advanced features
- Learn about [targeting rules](../api/targeting-rules.md)
- Set up [real-time updates](../architecture/index.md)
- Implement [A/B testing](../best-practices/ab-testing.md) 