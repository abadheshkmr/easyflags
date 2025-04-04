#!/usr/bin/env node

/**
 * Feature Flag Evaluation Flow Test
 * 
 * This script tests the entire feature flag evaluation flow:
 * 1. Initialize SDK with tenant ID
 * 2. Authenticate
 * 3. Evaluate flags with different contexts
 * 4. Test caching behavior
 * 5. Observe WebSocket updates
 */

const axios = require('axios');
const WebSocket = require('ws');
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-api-key-123456';
const FLAG_KEY = process.env.FLAG_KEY || 'test-flag';

// Load test configuration from .env.test file if it exists
let TENANT_ID = process.env.TENANT_ID || 'test-tenant';
const envTestPath = path.join(__dirname, '..', '..', '.env.test');
if (fs.existsSync(envTestPath)) {
  const testConfig = dotenv.parse(fs.readFileSync(envTestPath));
  TENANT_ID = testConfig.TENANT_ID || TENANT_ID;
  console.log(`Loaded test configuration for tenant: ${TENANT_ID}`);
}

console.log('🚩 Feature Flag Evaluation Flow Test');
console.log('===================================');
console.log(`API URL: ${API_URL}`);
console.log(`Tenant ID: ${TENANT_ID}`);
console.log(`Flag Key: ${FLAG_KEY}`);

// Mock SDK client
class MockFeatureFlagSDK {
  constructor(tenantId, apiKey) {
    this.tenantId = tenantId;
    this.apiKey = apiKey;
    this.token = null;
    this.cache = new Map();
    this.ws = null;
    this.baseUrl = API_URL;
  }

  async initialize() {
    console.log('\n📡 Initializing SDK with tenant ID...');
    try {
      // Authenticate with backend
      const authResponse = await axios.post(`${this.baseUrl}/api/v1/auth/token`, {
        apiKey: this.apiKey,
        tenantId: this.tenantId
      });
      
      this.token = authResponse.data.token;
      console.log('✅ Authentication successful');
      
      // Connect to WebSocket for real-time updates
      this.setupWebSocket();
      
      return true;
    } catch (error) {
      console.error('❌ SDK initialization failed:', error.message);
      return false;
    }
  }

  setupWebSocket() {
    console.log('\n🔌 Setting up WebSocket connection...');
    
    // Using Socket.IO client instead of native WebSocket
    this.ws = io(`${this.baseUrl}/api/v1/flags`, {
      transports: ['websocket'],
      query: { tenantId: this.tenantId }
    });
    
    this.ws.on('connect', () => {
      console.log('✅ WebSocket connection established');
    });
    
    this.ws.on('flag-changed', (data) => {
      console.log(`\n�� Flag "${data.key}" was updated - invalidating cache`);
      this.cache.delete(data.key);
    });
    
    this.ws.on('connection', (data) => {
      console.log(`\n📢 WebSocket connection acknowledgement: ${JSON.stringify(data)}`);
    });
    
    this.ws.on('pong', (data) => {
      console.log(`\n📢 Received pong response: ${JSON.stringify(data)}`);
    });
    
    this.ws.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });
  }

  async evaluateFlag(flagKey, context = {}) {
    const cacheKey = `${flagKey}-${JSON.stringify(context)}`;
    
    // Check local cache first
    if (this.cache.has(cacheKey)) {
      console.log(`\n🔍 Evaluating flag "${flagKey}" - CACHE HIT`);
      return this.cache.get(cacheKey);
    }
    
    console.log(`\n🔍 Evaluating flag "${flagKey}" - CACHE MISS, fetching from API...`);
    console.log(`🔍 URL: ${this.baseUrl}/api/v1/api/v1/evaluation/${flagKey}`);
    console.log(`🔍 Headers:`, {
      'Authorization': `Bearer ${this.token}`,
      'X-Tenant-ID': this.tenantId,
      'Content-Type': 'application/json'
    });
    console.log(`🔍 Request Payload:`, JSON.stringify(context, null, 2));
    
    try {
      // Call the evaluation API with correct double-prefix
      const evaluationResponse = await axios.post(
        `${this.baseUrl}/api/v1/api/v1/evaluation/${flagKey}`,
        context,
        { 
          headers: { 
            'Authorization': `Bearer ${this.token}`,
            'X-Tenant-ID': this.tenantId,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log(`✅ Response Status: ${evaluationResponse.status}`);
      console.log(`✅ Response Data:`, JSON.stringify(evaluationResponse.data, null, 2));
      
      const result = evaluationResponse.data;
      
      // Store in local cache
      this.cache.set(cacheKey, result);
      console.log(`✅ Flag evaluation successful, result cached`);
      
      return result;
    } catch (error) {
      console.error(`❌ Flag evaluation failed:`, error.message);
      if (error.response) {
        console.error(`❌ Response Status: ${error.response.status}`);
        console.error(`❌ Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
      return { value: null, error: error.message };
    }
  }
  
  close() {
    if (this.ws) {
      this.ws.disconnect(); // Socket.IO disconnect method
      console.log('\n🔌 WebSocket connection closed');
    }
  }
}

async function runTest() {
  // Create SDK instance
  const sdk = new MockFeatureFlagSDK(TENANT_ID, API_KEY);
  
  try {
    // Step 1: Initialize SDK
    const initialized = await sdk.initialize();
    if (!initialized) {
      console.error('❌ Test failed: SDK initialization error');
      return;
    }
    
    // Step 2: Evaluate flag with first context
    console.log('\n🧪 Test 1: First evaluation (cache miss expected)');
    const context1 = { 
      userId: 'test-user-1',
      userRole: 'user', 
      userGroups: ['test-group'],
      location: {
        country: 'US'
      }
    };
    const result1 = await sdk.evaluateFlag(FLAG_KEY, context1);
    console.log(`Result:`, result1);
    
    // Step 3: Evaluate same flag with same context (should be cached)
    console.log('\n🧪 Test 2: Second evaluation with same context (cache hit expected)');
    const result2 = await sdk.evaluateFlag(FLAG_KEY, context1);
    console.log(`Result:`, result2);
    
    // Step 4: Evaluate with different context
    console.log('\n🧪 Test 3: Evaluation with different context (cache miss expected)');
    const context2 = { 
      userId: 'test-user-2',
      userRole: 'admin',
      userGroups: ['admin-group'], 
      location: {
        country: 'UK'
      }
    };
    const result3 = await sdk.evaluateFlag(FLAG_KEY, context2);
    console.log(`Result:`, result3);
    
    // Step 5: Wait for potential WebSocket updates
    console.log('\n⏳ Waiting for potential WebSocket updates (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cleanup
    sdk.close();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

runTest().catch(console.error); 