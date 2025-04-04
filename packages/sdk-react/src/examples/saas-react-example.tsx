/**
 * Example of using the Feature Flag React SDK in a SaaS application
 * 
 * This demonstrates how to set up the provider, use hooks, and handle
 * tenant switching in a typical React SaaS application.
 */

import React, { useEffect, useState } from 'react';
import {
  FeatureFlagProvider,
  useFeatureFlag,
  useTenantId,
  FeatureFlag,
  useFeatureFlagClient
} from '../../src';

// Example User type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  subscription: string;
}

// Mock Authentication Context
const AuthContext = React.createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
}>({
  user: null,
  login: async () => {},
  logout: () => {},
  switchTenant: () => {}
});

// Example Authentication Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    // Mock login logic
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email === 'admin@example.com') {
      setUser({
        id: 'usr_123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        tenantId: 'tenant_main',
        subscription: 'enterprise'
      });
    } else if (email === 'user@example.com') {
      setUser({
        id: 'usr_456',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
        tenantId: 'tenant_a',
        subscription: 'basic'
      });
    } else {
      throw new Error('Invalid credentials');
    }
  };
  
  const logout = () => {
    setUser(null);
  };
  
  const switchTenant = (tenantId: string) => {
    if (user) {
      setUser({ ...user, tenantId });
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, switchTenant }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
function useAuth() {
  return React.useContext(AuthContext);
}

// Main Application Component
function SaasApp() {
  const { user, login, logout, switchTenant } = useAuth();
  const [userContext, setUserContext] = useState<Record<string, any>>({});
  
  // Update user context when the user changes
  useEffect(() => {
    if (user) {
      setUserContext({
        userId: user.id,
        userRole: user.role,
        subscription: user.subscription
      });
    } else {
      setUserContext({});
    }
  }, [user]);
  
  // Feature flags to preload for better performance
  const preloadedFlags = [
    'dark-mode',
    'beta-features',
    'new-dashboard'
  ];
  
  return (
    <FeatureFlagProvider 
      config={{ 
        baseUrl: 'https://feature-flags-api.example.com',
        debug: true
      }}
      tenantId={user?.tenantId}
      userContext={userContext}
      preloadedFlags={preloadedFlags}
    >
      <div className="saas-app">
        <header>
          <h1>SaaS Application</h1>
          
          {user ? (
            <div className="user-info">
              <span>Welcome, {user.name}</span>
              <button onClick={logout}>Logout</button>
              
              {/* Tenant switcher */}
              <TenantSwitcher />
            </div>
          ) : (
            <LoginForm onLogin={login} />
          )}
        </header>
        
        <main>
          {user ? <Dashboard /> : <LandingPage />}
        </main>
      </div>
    </FeatureFlagProvider>
  );
}

// Login Form Component
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email:</label>
        <input 
          type="email" 
          id="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input 
          type="password" 
          id="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <p className="hint">Try: user@example.com or admin@example.com with any password</p>
    </form>
  );
}

// Tenant Switcher Component
function TenantSwitcher() {
  const { user, switchTenant } = useAuth();
  const [currentTenantId, setTenantId] = useTenantId();
  const ffClient = useFeatureFlagClient();
  
  const tenants = [
    { id: 'tenant_main', name: 'Main Organization' },
    { id: 'tenant_a', name: 'Project A' },
    { id: 'tenant_b', name: 'Project B' },
  ];
  
  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenantId = e.target.value;
    
    // Update tenant in auth context
    switchTenant(newTenantId);
    
    // The feature flag tenant ID will update automatically through the provider
    // when user.tenantId changes, but we could also set it explicitly:
    // setTenantId(newTenantId);
  };
  
  return (
    <div className="tenant-switcher">
      <label htmlFor="tenant-select">Current Tenant:</label>
      <select 
        id="tenant-select" 
        value={user?.tenantId || ''} 
        onChange={handleTenantChange}
      >
        {tenants.map(tenant => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// Dashboard Component - Uses feature flags
function Dashboard() {
  const { user } = useAuth();
  
  // Use feature flag hooks to get flag values
  const isDarkModeEnabled = useFeatureFlag('dark-mode');
  const isBetaFeaturesEnabled = useFeatureFlag('beta-features');
  
  return (
    <div className={`dashboard ${isDarkModeEnabled ? 'dark-mode' : ''}`}>
      <h2>Welcome to your Dashboard</h2>
      <p>Tenant ID: {user?.tenantId}</p>
      
      {/* Standard feature flag integration */}
      {isDarkModeEnabled && (
        <div className="theme-controls">
          <h3>Dark Mode Enabled</h3>
          <p>You're using the new dark theme.</p>
        </div>
      )}
      
      {/* Using the FeatureFlag component */}
      <FeatureFlag flag="new-dashboard" fallback={false}>
        <div className="new-dashboard">
          <h3>New Dashboard UI</h3>
          <p>You're seeing the new dashboard experience.</p>
        </div>
      </FeatureFlag>
      
      {/* Feature with targeting rules */}
      <FeatureFlag 
        flag="beta-features" 
        renderOff={
          <div className="upgrade-notice">
            <h3>Upgrade to try Beta Features</h3>
            <p>Become a beta tester to access experimental features.</p>
          </div>
        }
      >
        <div className="beta-features">
          <h3>Beta Features Enabled</h3>
          <p>You have access to experimental features.</p>
        </div>
      </FeatureFlag>
    </div>
  );
}

// Simple Landing Page
function LandingPage() {
  return (
    <div className="landing-page">
      <h2>Welcome to our SaaS Platform</h2>
      <p>Please log in to access your dashboard.</p>
    </div>
  );
}

// Export for demonstration purposes
export { SaasApp, AuthProvider }; 