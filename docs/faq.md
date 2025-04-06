# Frequently Asked Questions

## Permission System

### What permissions do I need to manage feature flags?

To work with feature flags, you'll need some or all of the following permissions:
- `view:flags` - To view flags
- `create:flags` - To create new flags
- `edit:flags` - To modify existing flags
- `delete:flags` - To delete flags
- `toggle:flags` - To enable/disable flags

Administrators can assign these permissions individually or through roles.

### How do I check which permissions I have?

You can view your current permissions in two ways:
1. In the UI: Navigate to your profile and select the "Permissions" tab
2. Via API: Make a GET request to `/api/users/me/permissions`

### What should I do if I get a "Permission denied" error?

If you receive a "Permission denied" error, it means you lack the required permissions for that action. The error response will include the specific permissions needed. Contact your system administrator to request these permissions.

### What's the difference between roles and permissions?

- **Permissions** are individual access rights in the format `action:resource` (e.g., `view:flags`)
- **Roles** are collections of permissions bundled together for common user types (e.g., "Editor", "Admin")

Roles make permission management easier by allowing administrators to assign multiple permissions at once.

### Can I create custom roles?

Yes, users with the `assign:roles` permission can create and manage custom roles. Custom roles can contain any combination of permissions to match your organization's specific needs.

## Feature Flags

### What's the difference between a feature flag and a targeting rule?

A feature flag is a toggle that can enable or disable a feature. A targeting rule defines the specific conditions under which the feature should be enabled, such as for certain user segments, regions, or devices.

### How do I implement percentage-based rollouts?

Use a targeting rule with a percentage condition. For example, to roll out a feature to 25% of users:

1. Create a targeting rule
2. Set the condition type to "Percentage"
3. Set the value to 25

The system will consistently assign users to either the enabled or disabled group based on their user ID.

### How can I test a feature flag before releasing it?

Use a targeting rule that includes only test user IDs or test environments. This allows you to validate the feature with a limited audience before wider release.

## API Keys

### How do I create an API key?

To create an API key, you need the `create:apikeys` permission. You can generate a key in the UI under Settings > API Keys or via the API with a POST request to `/api/users/apikeys`.

### What permissions are assigned to API keys?

API keys inherit the permissions of the user who created them, unless specific permissions are assigned during creation. For evaluation-only API keys, they are restricted to flag evaluation endpoints.

### How do I rotate API keys?

For security, it's recommended to rotate API keys regularly:

1. Create a new API key
2. Update your applications to use the new key
3. Once all systems are updated, delete the old key

## Multi-Tenant Architecture

### How are permissions managed across tenants?

Permissions are scoped to tenants by default. A user with `view:flags` in Tenant A doesn't automatically have the same permission in Tenant B. However, users with cross-tenant permissions (e.g., `cross:tenant:admin`) can operate across tenant boundaries.

### Can I copy permission configurations between tenants?

Yes, administrators with the `cross:tenant:admin` permission can copy role and permission configurations between tenants, making it easier to maintain consistent access control across your organization.
