/**
 * Example of using the Feature Flag SDK in a SaaS application
 * 
 * This demonstrates how to use the SDK with multiple tenants
 * and how to handle tenant switching and context management.
 */

import { FeatureFlagClient } from '../client';

// Example SaaS user object
interface SaasUser {
  id: string;
  email: string;
  role: string;
  name: string;
  tenantId: string;
  subscription: string;
}

// Example SaaS application class that uses feature flags
class SaasApplication {
  private client: FeatureFlagClient;
  private currentUser: SaasUser | null = null;
  
  constructor() {
    // Initialize the client with no specific tenant yet
    this.client = new FeatureFlagClient({
      baseUrl: 'https://feature-flags-api.example.com',
      debug: true
    });
    
    console.log('SaaS application initialized');
  }
  
  /**
   * Handle user login
   */
  async login(email: string, password: string): Promise<void> {
    console.log(`Logging in user: ${email}`);
    
    // This would be an actual API call in a real application
    const user: SaasUser = await this.mockLoginApi(email, password);
    this.currentUser = user;
    
    // Set the tenant ID in the feature flag client
    this.client.setTenantId(user.tenantId);
    
    // Set up a context provider to automatically include user data
    this.client.setContextProvider(() => ({
      userId: user.id,
      userRole: user.role,
      subscription: user.subscription
    }));
    
    console.log(`User logged in: ${user.name} (Tenant: ${user.tenantId})`);
  }
  
  /**
   * Switch to a different tenant (for multi-tenant users)
   */
  switchTenant(tenantId: string): void {
    if (!this.currentUser) {
      throw new Error('No user is logged in');
    }
    
    console.log(`Switching from tenant ${this.currentUser.tenantId} to ${tenantId}`);
    
    // Update user's tenant ID
    this.currentUser.tenantId = tenantId;
    
    // Update the client's tenant ID
    this.client.setTenantId(tenantId);
    
    // Clear the cache to ensure fresh flags for the new tenant
    this.client.clearCache();
    
    console.log(`Switched to tenant: ${tenantId}`);
  }
  
  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    if (!this.currentUser) {
      throw new Error('No user is logged in');
    }
    
    try {
      // The client will use the currently set tenant ID
      const result = await this.client.evaluate(featureKey);
      return !!result;
    } catch (error) {
      console.error(`Error checking feature ${featureKey}:`, error);
      return false;
    }
  }
  
  /**
   * Get all feature flags for the current user/tenant
   */
  async getAllFeatures(featureKeys: string[]): Promise<Record<string, any>> {
    if (!this.currentUser) {
      throw new Error('No user is logged in');
    }
    
    try {
      // Batch evaluate all the requested flags
      return await this.client.evaluateAll(featureKeys);
    } catch (error) {
      console.error('Error getting features:', error);
      return {};
    }
  }
  
  /**
   * Mock login API (in a real app, this would call your auth service)
   */
  private async mockLoginApi(email: string, password: string): Promise<SaasUser> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock user based on email
    if (email === 'admin@example.com') {
      return {
        id: 'usr_123',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
        tenantId: 'tenant_main',
        subscription: 'enterprise'
      };
    } else if (email === 'user@example.com') {
      return {
        id: 'usr_456',
        email: 'user@example.com',
        role: 'user',
        name: 'Regular User',
        tenantId: 'tenant_a',
        subscription: 'basic'
      };
    } else {
      throw new Error('Invalid credentials');
    }
  }
}

// Example usage
async function runExample() {
  const app = new SaasApplication();
  
  // Log in as a regular user
  await app.login('user@example.com', 'password');
  
  // Check some features
  console.log('Dark mode enabled:', await app.isFeatureEnabled('dark-mode'));
  console.log('Beta features enabled:', await app.isFeatureEnabled('beta-features'));
  
  // Get multiple features at once
  const features = await app.getAllFeatures(['dark-mode', 'beta-features', 'new-dashboard']);
  console.log('All features:', features);
  
  // Switch tenant
  app.switchTenant('tenant_b');
  
  // Features may be different for the new tenant
  console.log('Dark mode after tenant switch:', await app.isFeatureEnabled('dark-mode'));
  
  // Log in as admin user
  await app.login('admin@example.com', 'password');
  
  // Admin users might have different flags
  console.log('Admin - Beta features enabled:', await app.isFeatureEnabled('beta-features'));
}

// In a real application, you'd call this when your app initializes
// runExample().catch(console.error);

// Export for documentation
export { SaasApplication, runExample }; 