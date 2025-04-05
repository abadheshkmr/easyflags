/**
 * Feature Flag Client SDK
 * An SDK for evaluating feature flags in client applications
 * with support for multi-tenancy
 */

export interface FeatureFlagOptions {
  // The base URL of the feature flag API
  baseUrl?: string;
  
  // Default tenant ID to use when not specified in context
  tenantId?: string;
  
  // Optional authorization token
  authToken?: string;
  
  // Function to provide a global context for all evaluations
  contextProvider?: () => Record<string, any>;
  
  // Whether to enable websocket for real-time updates
  enableRealtime?: boolean;
  
  // Custom fetch options
  fetchOptions?: RequestInit;

  // Cache TTL in milliseconds (default: 30000ms = 30s)
  cacheTtl?: number;
  
  // Whether to enable debug logging
  debug?: boolean;
}

// Represents any value a feature flag could return
export type FlagValue = boolean | string | number | object | null;

// Evaluation context with properties to target specific users/sessions
export interface EvaluationContext {
  [key: string]: any;
  tenantId?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Feature Flag Client
 * - Evaluates feature flags based on context
 * - Supports multi-tenancy
 * - Handles caching and batching
 * - Can connect to WebSockets for real-time updates
 */
export class FeatureFlagClient {
  private baseUrl: string;
  private defaultTenantId?: string;
  private authToken?: string;
  private contextProvider: () => Record<string, any>;
  private enableRealtime: boolean;
  private fetchOptions: RequestInit;
  private cacheTtl: number;
  private debug: boolean;
  
  // In-memory cache for flag values
  private cache: Map<string, { value: FlagValue, expiresAt: number }> = new Map();
  
  // Batch queue for multiple evaluations
  private batchQueue: Map<string, { resolve: Function, reject: Function }> = new Map();
  private batchTimeout?: NodeJS.Timeout;
  
  // WebSocket connection
  private ws?: WebSocket;
  private reconnectTimeout?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  
  // Listeners for flag updates
  private listeners: Map<string, Set<(value: FlagValue) => void>> = new Map();

  /**
   * Create a new FeatureFlagClient
   */
  constructor(options: FeatureFlagOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.defaultTenantId = options.tenantId;
    this.authToken = options.authToken;
    this.contextProvider = options.contextProvider || (() => ({}));
    this.enableRealtime = options.enableRealtime !== false;
    this.fetchOptions = options.fetchOptions || {};
    this.cacheTtl = options.cacheTtl || 30000; // 30 seconds default
    this.debug = options.debug || false;
    
    // Initialize WebSocket connection if enabled
    if (this.enableRealtime && typeof WebSocket !== 'undefined') {
      this.initWebSocket();
    }
    
    this.log('Feature Flag Client initialized');
  }

  /**
   * Set the default tenant ID
   */
  setTenantId(tenantId: string): void {
    this.defaultTenantId = tenantId;
    this.log(`Default tenant ID set to: ${tenantId}`);
  }
  
  /**
   * Set the authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.log('Auth token updated');
  }
  
  /**
   * Set a global context provider
   */
  setContextProvider(provider: () => Record<string, any>): void {
    this.contextProvider = provider;
    this.log('Context provider updated');
  }

  /**
   * Evaluate a feature flag
   */
  async evaluate(flagKey: string, context: EvaluationContext = {}): Promise<FlagValue> {
    // Determine which tenant ID to use
    const tenantId = context.tenantId || this.defaultTenantId;
    
    if (!tenantId) {
      throw new Error('No tenant ID provided. Set a default tenant ID or include it in the context.');
    }
    
    // Check cache first
    const cacheKey = this.getCacheKey(flagKey, tenantId, context);
    const cachedItem = this.cache.get(cacheKey);
    
    if (cachedItem && cachedItem.expiresAt > Date.now()) {
      this.log(`Cache hit for flag: ${flagKey}`);
      return cachedItem.value;
    }
    
    // Merge context with global context provider
    const fullContext = {
      ...this.contextProvider(),
      ...context
    };
    
    try {
      const startTime = Date.now();
      
      // Make the API request
      const response = await fetch(`${this.baseUrl}/api/v1/evaluate/${flagKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
          ...this.fetchOptions.headers
        },
        body: JSON.stringify(fullContext),
        ...this.fetchOptions
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const value = result.value;
      
      // Cache the result
      this.cache.set(cacheKey, {
        value,
        expiresAt: Date.now() + this.cacheTtl
      });
      
      const duration = Date.now() - startTime;
      this.log(`Evaluated flag ${flagKey} in ${duration}ms: ${JSON.stringify(value)}`);
      
      return value;
    } catch (error) {
      this.log(`Error evaluating flag ${flagKey}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Evaluate multiple flags at once
   */
  async evaluateAll(flagKeys: string[], context: EvaluationContext = {}): Promise<Record<string, FlagValue>> {
    // Determine which tenant ID to use
    const tenantId = context.tenantId || this.defaultTenantId;
    
    if (!tenantId) {
      throw new Error('No tenant ID provided. Set a default tenant ID or include it in the context.');
    }
    
    // Check if all flags are cached
    const results: Record<string, FlagValue> = {};
    const uncachedKeys: string[] = [];
    
    for (const key of flagKeys) {
      const cacheKey = this.getCacheKey(key, tenantId, context);
      const cachedItem = this.cache.get(cacheKey);
      
      if (cachedItem && cachedItem.expiresAt > Date.now()) {
        results[key] = cachedItem.value;
      } else {
        uncachedKeys.push(key);
      }
    }
    
    // If all flags were cached, return immediately
    if (uncachedKeys.length === 0) {
      this.log(`All ${flagKeys.length} flags were cached`);
      return results;
    }
    
    // Merge context with global context provider
    const fullContext = {
      ...this.contextProvider(),
      ...context
    };
    
    try {
      const startTime = Date.now();
      
      // Make the batch API request
      const response = await fetch(`${this.baseUrl}/api/v1/evaluate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
          ...this.fetchOptions.headers
        },
        body: JSON.stringify({
          keys: uncachedKeys,
          context: fullContext
        }),
        ...this.fetchOptions
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const batchResults = await response.json();
      
      // Cache and merge results
      for (const key of uncachedKeys) {
        if (batchResults.results[key]) {
          const value = batchResults.results[key].value;
          results[key] = value;
          
          // Cache the result
          const cacheKey = this.getCacheKey(key, tenantId, context);
          this.cache.set(cacheKey, {
            value,
            expiresAt: Date.now() + this.cacheTtl
          });
        } else if (batchResults.errors && batchResults.errors[key]) {
          this.log(`Error evaluating flag ${key}: ${batchResults.errors[key]}`, 'error');
        }
      }
      
      const duration = Date.now() - startTime;
      this.log(`Batch evaluated ${uncachedKeys.length} flags in ${duration}ms`);
      
      return results;
    } catch (error) {
      this.log(`Error batch evaluating flags: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Subscribe to flag updates via WebSocket
   */
  subscribe(flagKey: string, callback: (value: FlagValue) => void, tenantId?: string): () => void {
    // Use the provided tenant ID or fall back to default
    const effectiveTenantId = tenantId || this.defaultTenantId;
    
    if (!effectiveTenantId) {
      throw new Error('No tenant ID provided. Set a default tenant ID or provide it explicitly.');
    }
    
    // Create a subscription key
    const subscriptionKey = `${effectiveTenantId}:${flagKey}`;
    
    // Add the callback to the listeners
    if (!this.listeners.has(subscriptionKey)) {
      this.listeners.set(subscriptionKey, new Set());
    }
    
    this.listeners.get(subscriptionKey)!.add(callback);
    
    // Make sure WebSocket is connected
    if (this.enableRealtime && typeof WebSocket !== 'undefined' && !this.ws) {
      this.initWebSocket();
    }
    
    this.log(`Subscribed to flag: ${flagKey} for tenant: ${effectiveTenantId}`);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(subscriptionKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(subscriptionKey);
        }
      }
      this.log(`Unsubscribed from flag: ${flagKey} for tenant: ${effectiveTenantId}`);
    };
  }

  /**
   * Clear the cache for a specific flag or all flags
   */
  clearCache(flagKey?: string, tenantId?: string): void {
    // If no flagKey is provided, clear the entire cache
    if (!flagKey) {
      this.cache.clear();
      this.log('Cleared entire cache');
      return;
    }
    
    // If no tenantId is provided, use the default
    const effectiveTenantId = tenantId || this.defaultTenantId;
    
    if (!effectiveTenantId) {
      throw new Error('No tenant ID provided. Set a default tenant ID or provide it explicitly.');
    }
    
    // Clear cache for this flag + tenant combination
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(`${effectiveTenantId}:${flagKey}:`)) {
        this.cache.delete(cacheKey);
      }
    }
    
    this.log(`Cleared cache for flag: ${flagKey} in tenant: ${effectiveTenantId}`);
  }

  /**
   * Generate a cache key for a flag+tenant+context combination
   */
  private getCacheKey(flagKey: string, tenantId: string, context: EvaluationContext): string {
    // Create a stable representation of the context
    // Only include keys that could affect targeting
    const relevantContext: Record<string, any> = {};
    if (context.userId) relevantContext.userId = context.userId;
    if (context.sessionId) relevantContext.sessionId = context.sessionId;
    
    // Add any additional context keys that could affect targeting
    // This can be customized based on your targeting rules
    const targetingKeys = ['userType', 'userRole', 'subscription', 'country', 'device'];
    targetingKeys.forEach(key => {
      if (context[key] !== undefined) {
        relevantContext[key] = context[key];
      }
    });
    
    // Create a stable hash of the context
    const contextStr = Object.keys(relevantContext).length > 0
      ? ':' + JSON.stringify(relevantContext)
      : '';
    
    return `${tenantId}:${flagKey}${contextStr}`;
  }

  /**
   * Initialize WebSocket connection for real-time flag updates
   */
  private initWebSocket(): void {
    if (!this.enableRealtime || typeof WebSocket === 'undefined') {
      return;
    }
    
    // Clean up any existing connection
    if (this.ws) {
      this.ws.close();
    }
    
    // Clear any reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    try {
      // Determine WebSocket URL (convert http to ws, https to wss)
      const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/api/ws';
      
      // Create WebSocket with auth token if available
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      if (this.defaultTenantId) {
        headers['x-tenant-id'] = this.defaultTenantId;
      }
      
      // WebSocket doesn't support custom headers directly, so add them as query params if needed
      const urlWithAuth = wsUrl + (Object.keys(headers).length > 0
        ? '?' + Object.entries(headers).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
        : '');
      
      this.ws = new WebSocket(urlWithAuth);
      
      // Handle connection events
      this.ws.onopen = () => {
        this.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to flags
        const subscriptions: string[] = [];
        for (const key of this.listeners.keys()) {
          subscriptions.push(key);
        }
        
        if (subscriptions.length > 0) {
          this.ws!.send(JSON.stringify({
            type: 'subscribe',
            flags: subscriptions
          }));
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'flag-update') {
            const { tenantId, key, value } = data;
            const subscriptionKey = `${tenantId}:${key}`;
            
            // Update cache
            for (const cacheKey of this.cache.keys()) {
              if (cacheKey.startsWith(`${tenantId}:${key}:`)) {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                  this.cache.set(cacheKey, {
                    value,
                    expiresAt: Date.now() + this.cacheTtl
                  });
                }
              }
            }
            
            // Notify listeners
            const listeners = this.listeners.get(subscriptionKey);
            if (listeners) {
              listeners.forEach(callback => {
                try {
                  callback(value);
                } catch (err) {
                  this.log(`Error in flag update callback: ${err}`, 'error');
                }
              });
            }
            
            this.log(`Flag update received: ${tenantId}:${key} = ${JSON.stringify(value)}`);
          }
        } catch (err) {
          this.log(`Error processing WebSocket message: ${err}`, 'error');
        }
      };
      
      this.ws.onclose = () => {
        this.log('WebSocket disconnected');
        
        // Reconnect with backoff
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        this.log(`WebSocket error: ${error}`, 'error');
        
        // Close and schedule reconnect
        this.ws!.close();
      };
    } catch (error) {
      this.log(`Error initializing WebSocket: ${error}`, 'error');
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule WebSocket reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Calculate backoff time (max 30 seconds)
    const backoff = Math.min(30000, 1000 * Math.pow(1.5, this.reconnectAttempts++));
    
    this.log(`Scheduling WebSocket reconnect in ${backoff}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.initWebSocket();
    }, backoff);
  }

  /**
   * Internal logging function
   */
  private log(message: string, level: 'log' | 'error' = 'log'): void {
    if (!this.debug) {
      return;
    }
    
    const prefix = '[FeatureFlag SDK]';
    
    if (level === 'error') {
      console.error(`${prefix} ${message}`);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Clean up resources when the client is no longer needed
   */
  destroy(): void {
    // Clear all timeouts
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    
    // Clear caches and listeners
    this.cache.clear();
    this.batchQueue.clear();
    this.listeners.clear();
    
    this.log('Client destroyed');
  }
} 