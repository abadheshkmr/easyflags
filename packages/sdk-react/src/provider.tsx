import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeatureFlagClient, FeatureFlagOptions, FlagValue, EvaluationContext } from '@feature-flag-service/sdk-js';

// Feature Flag Context Type
interface FeatureFlagContextType {
  client: FeatureFlagClient | null;
  loading: boolean;
  tenantId: string | undefined;
  setTenantId: (tenantId: string) => void;
  flags: Record<string, FlagValue>;
  isReady: boolean;
}

// Provider Props
interface FeatureFlagProviderProps {
  children: ReactNode;
  config?: FeatureFlagOptions;
  tenantId?: string;
  userContext?: Record<string, any>;
  preloadedFlags?: string[];
}

// Create a React context for feature flags
const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

/**
 * Provider component that makes the feature flag client available to all child components
 */
export function FeatureFlagProvider({
  children,
  config = {},
  tenantId,
  userContext = {},
  preloadedFlags = [],
}: FeatureFlagProviderProps) {
  const [client, setClient] = useState<FeatureFlagClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [currentTenantId, setCurrentTenantId] = useState<string | undefined>(tenantId);
  const [flags, setFlags] = useState<Record<string, FlagValue>>({});

  // Initialize client when component mounts
  useEffect(() => {
    const ffClient = new FeatureFlagClient({
      ...config,
      tenantId: currentTenantId,
      contextProvider: () => userContext,
    });

    setClient(ffClient);
    setLoading(false);

    // Clean up function for when component unmounts
    return () => {
      ffClient.destroy();
    };
  }, []);

  // Function to update tenant ID
  const updateTenantId = (newTenantId: string) => {
    setCurrentTenantId(newTenantId);
    if (client) {
      client.setTenantId(newTenantId);
      client.clearCache(); // Clear cache when tenant changes
      
      // Reload any preloaded flags with new tenant
      if (preloadedFlags.length > 0) {
        preloadFlags();
      }
    }
  };

  // Update client when user context changes
  useEffect(() => {
    if (client) {
      client.setContextProvider(() => userContext);
    }
  }, [client, JSON.stringify(userContext)]);

  // Update tenant ID when prop changes
  useEffect(() => {
    if (tenantId !== currentTenantId && tenantId !== undefined) {
      updateTenantId(tenantId);
    }
  }, [tenantId]);

  // Preload flags if requested
  const preloadFlags = async () => {
    if (!client || !currentTenantId || preloadedFlags.length === 0) {
      return;
    }

    setIsReady(false);
    
    try {
      const results = await client.evaluateAll(preloadedFlags, { tenantId: currentTenantId });
      setFlags(prev => ({
        ...prev,
        ...results
      }));
    } catch (error) {
      console.error('Error preloading flags:', error);
    } finally {
      setIsReady(true);
    }
  };

  // Load preloaded flags when client is ready and tenant ID is set
  useEffect(() => {
    if (client && currentTenantId && preloadedFlags.length > 0) {
      preloadFlags();
    } else if (client && currentTenantId) {
      // Mark as ready if we don't need to preload flags
      setIsReady(true);
    }
  }, [client, currentTenantId]);

  // Create the context value
  const contextValue: FeatureFlagContextType = {
    client,
    loading,
    tenantId: currentTenantId,
    setTenantId: updateTenantId,
    flags,
    isReady
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to use feature flags in React components
 */
export function useFeatureFlag(flagKey: string, fallbackValue: FlagValue = false): FlagValue {
  const context = useContext(FeatureFlagContext);
  const [value, setValue] = useState<FlagValue>(fallbackValue);
  const [isLoading, setIsLoading] = useState(true);

  if (!context) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }

  const { client, flags, tenantId } = context;

  // Check if we already have the flag in our preloaded flags
  useEffect(() => {
    if (flags && flags[flagKey] !== undefined) {
      setValue(flags[flagKey]);
      setIsLoading(false);
      return;
    }

    // If not preloaded, evaluate the flag
    let isMounted = true;
    if (client && tenantId) {
      setIsLoading(true);
      client.evaluate(flagKey, { tenantId })
        .then(result => {
          if (isMounted) {
            setValue(result !== null ? result : fallbackValue);
            setIsLoading(false);
          }
        })
        .catch(error => {
          console.error(`Error evaluating flag ${flagKey}:`, error);
          if (isMounted) {
            setValue(fallbackValue);
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [client, flagKey, tenantId, fallbackValue, flags]);

  // Subscribe to flag updates
  useEffect(() => {
    if (!client || !tenantId) return;

    // Set up subscription for real-time updates
    const unsubscribe = client.subscribe(
      flagKey,
      (newValue) => {
        setValue(newValue !== null ? newValue : fallbackValue);
      },
      tenantId
    );

    return unsubscribe;
  }, [client, flagKey, tenantId, fallbackValue]);

  return value;
}

/**
 * Hook to check if the feature flag provider is ready
 */
export function useFeatureFlagReady(): boolean {
  const context = useContext(FeatureFlagContext);
  
  if (!context) {
    throw new Error('useFeatureFlagReady must be used within a FeatureFlagProvider');
  }

  return context.isReady;
}

/**
 * Hook to access the feature flag client directly
 */
export function useFeatureFlagClient(): FeatureFlagClient | null {
  const context = useContext(FeatureFlagContext);
  
  if (!context) {
    throw new Error('useFeatureFlagClient must be used within a FeatureFlagProvider');
  }

  return context.client;
}

/**
 * Hook to get and set the current tenant ID
 */
export function useTenantId(): [string | undefined, (tenantId: string) => void] {
  const context = useContext(FeatureFlagContext);
  
  if (!context) {
    throw new Error('useTenantId must be used within a FeatureFlagProvider');
  }

  return [context.tenantId, context.setTenantId];
}

/**
 * Higher-order component to wrap components that require feature flags
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P & { flagValue: FlagValue }>,
  flagKey: string,
  fallbackValue: FlagValue = false
): React.FC<P> {
  return (props: P) => {
    const flagValue = useFeatureFlag(flagKey, fallbackValue);
    return <Component {...props} flagValue={flagValue} />;
  };
}

/**
 * Component to conditionally render based on a feature flag
 */
export function FeatureFlag({
  flag,
  fallback = false,
  children,
  renderOff = null,
}: {
  flag: string;
  fallback?: FlagValue;
  children: ReactNode;
  renderOff?: ReactNode;
}): JSX.Element | null {
  const flagValue = useFeatureFlag(flag, fallback);

  if (flagValue === true || flagValue === 'true' || flagValue === 1) {
    return <>{children}</>;
  }

  return renderOff !== null ? <>{renderOff}</> : null;
} 