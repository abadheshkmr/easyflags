#!/usr/bin/env node

/**
 * System Overview Integration Test
 * 
 * This script tests the integration of all major components:
 * 1. Backend Server 
 * 2. Database
 * 3. Cache
 * 4. WebSocket Server
 * 5. SDKs
 */

const axios = require('axios');
const redis = require('redis');
const { promisify } = require('util');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const io = require('socket.io-client');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PG_CONNECTION = process.env.PG_CONNECTION || 'postgresql://postgres:postgres@localhost:5432/feature_flags';

// Load test configuration
let TENANT_ID = '45c98f23-6a89-4c87-b8c1-0e12d3a45b67'; // Default
let API_KEY = 'test-api-key';

// Try to load from .env.test file if it exists
const envTestPath = path.join(__dirname, '..', '..', '.env.test');
if (fs.existsSync(envTestPath)) {
  const testConfig = dotenv.parse(fs.readFileSync(envTestPath));
  TENANT_ID = testConfig.TENANT_ID || TENANT_ID;
  API_KEY = testConfig.API_KEY || API_KEY;
  console.log(`Loaded test configuration for tenant: ${TENANT_ID}`);
}

console.log('🔍 System Overview Integration Test');
console.log('================================');
console.log(`API URL: ${API_URL}`);
console.log(`Redis URL: ${REDIS_URL}`);
console.log(`PostgreSQL: ${PG_CONNECTION.replace(/:[^:]*@/, ':***@')}`); // Hide password in logs

async function testBackendServer() {
  console.log('\n🧪 Testing Backend Server');
  try {
    const response = await axios.get(`${API_URL}/api/monitoring/health`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('✅ Backend server is running and healthy');
      return true;
    } else {
      console.error('❌ Backend server responded but health check failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to backend server:', error.message);
    return false;
  }
}

async function testDatabase() {
  console.log('\n🧪 Testing Database Connection');
  const pool = new Pool({
    connectionString: PG_CONNECTION
  });
  
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT current_timestamp');
      console.log(`✅ Database connection successful, current time: ${result.rows[0].current_timestamp}`);
      
      // Check if tenants table exists
      const tableResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenant'
      `);
      
      if (tableResult.rows.length > 0) {
        console.log('✅ Database schema verified: tenant table exists');
      } else {
        console.error('❌ Database schema issue: tenant table not found');
      }
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function testRedisCache() {
  console.log('\n🧪 Testing Redis Cache');
  const client = redis.createClient({
    url: REDIS_URL
  });
  
  try {
    await client.connect();
    
    // Set a test value
    const testKey = `test:system:${Date.now()}`;
    const testValue = `test-value-${Date.now()}`;
    
    await client.set(testKey, testValue);
    const retrievedValue = await client.get(testKey);
    
    if (retrievedValue === testValue) {
      console.log('✅ Redis cache is working correctly');
      
      // Clean up
      await client.del(testKey);
      return true;
    } else {
      console.error(`❌ Redis cache issue: value mismatch (${retrievedValue} !== ${testValue})`);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to Redis cache:', error.message);
    return false;
  } finally {
    await client.quit();
  }
}

async function testWebSocketServer() {
  console.log('\n🧪 Testing WebSocket Server');
  return new Promise((resolve) => {
    let resolved = false;
    
    // Use Socket.io client instead of native WebSocket
    console.log('Connecting to WebSocket endpoint with Socket.io...');
    console.log(`URL: ${API_URL}/api/flags`);
    
    // Create a Socket.io client with the namespace
    const socket = io(`${API_URL}/api/flags`, {
      transports: ['websocket'],
      query: { tenantId: TENANT_ID },
      timeout: 5000
    });
    
    // Set a timeout in case connection never establishes
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error('❌ WebSocket connection timed out');
        socket.disconnect();
        resolved = true;
        resolve(false);
      }
    }, 5000);
    
    socket.on('connect', () => {
      console.log('✅ Socket.io connection established successfully');
      
      // Send a ping event
      socket.emit('ping');
      
      // Wait briefly for response
      setTimeout(() => {
        socket.disconnect();
        clearTimeout(timeout);
        resolved = true;
        resolve(true);
      }, 500);
    });
    
    socket.on('connection', (data) => {
      console.log('Received connection acknowledgement:', data);
    });
    
    socket.on('pong', (data) => {
      console.log('Received pong response:', data);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error.message);
      if (!resolved) {
        socket.disconnect();
        clearTimeout(timeout);
        resolved = true;
        resolve(false);
      }
    });
    
    socket.on('error', (error) => {
      console.error('❌ Socket.io error:', error);
      if (!resolved) {
        socket.disconnect();
        clearTimeout(timeout);
        resolved = true;
        resolve(false);
      }
    });
  });
}

async function testAuthentication() {
  console.log('\n🧪 Testing Authentication');
  
  // Define the payload
  const payload = {
    apiKey: API_KEY,
    tenantId: TENANT_ID
  };
  
  console.log(`Authenticating with API key: ${API_KEY}, tenant ID: ${TENANT_ID}`);
  console.log(`Request URL: ${API_URL}/api/auth/token`);
  console.log(`Request payload: ${JSON.stringify(payload)}`);
  
  try {
    // Create Axios request with explicit configurations
    const response = await axios({
      method: 'post',
      url: `${API_URL}/api/auth/token`,
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data)}`);
    
    if (response.data && response.data.token) {
      console.log('✅ Authentication successful');
      return response.data.token;
    } else {
      console.error('❌ Authentication failed: No token returned');
      console.error(`Response data: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data));
    }
    if (error.request) {
      console.error('Request was made but no response received');
    }
    return null;
  }
}

async function testFlagEvaluation(token) {
  console.log('\n🧪 Testing Flag Evaluation');
  
  if (!token) {
    console.error('❌ Skipping flag evaluation test due to authentication failure');
    return false;
  }
  
  try {
    // Use a known test flag key instead of fetching flags first
    const testFlagKey = 'test-flag';
    console.log(`Using test flag: "${testFlagKey}" for evaluation`);
    
    // The updated URL without versioning
    const evaluationResponse = await axios.post(
      `${API_URL}/api/evaluation/${testFlagKey}`,
      { userId: 'test-user', group: 'test' },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log(`✅ Flag evaluation successful, result: ${JSON.stringify(evaluationResponse.data)}`);
    return true;
  } catch (error) {
    console.error('❌ Flag evaluation failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data || {}));
    }
    return false;
  }
}

async function runTest() {
  try {
    // Test 1: Backend Server
    const serverOk = await testBackendServer();
    
    // Test 2: Database
    const dbOk = await testDatabase();
    
    // Test 3: Redis Cache
    const redisOk = await testRedisCache();
    
    // Test 4: WebSocket Server
    const wsOk = await testWebSocketServer();
    
    // Test 5: Authentication
    const token = await testAuthentication();
    const authOk = !!token;
    
    // Test 6: Flag Evaluation
    const evaluationOk = await testFlagEvaluation(token);
    
    // Summary
    console.log('\n📊 System Integration Test Summary');
    console.log('=============================');
    console.log(`Backend Server:  ${serverOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Database:        ${dbOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Redis Cache:     ${redisOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`WebSocket:       ${wsOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Authentication:  ${authOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Flag Evaluation: ${evaluationOk ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = serverOk && dbOk && redisOk && wsOk && authOk && evaluationOk;
    console.log(`\nOverall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

runTest().catch(console.error); 