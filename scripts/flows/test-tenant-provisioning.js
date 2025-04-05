#!/usr/bin/env node

/**
 * Tenant Provisioning and Isolation Test
 * 
 * This script tests:
 * 1. Creating a new tenant
 * 2. Setting up default flags for the tenant
 * 3. Verifying tenant isolation (data separation)
 * 4. Testing cross-tenant operations with admin privileges
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'replace-with-admin-token'; // Admin token with cross-tenant privileges

console.log('👥 Tenant Provisioning and Isolation Test');
console.log('=======================================');
console.log(`API URL: ${API_URL}`);

async function runTest() {
  try {
    // Generate unique tenant names for the test
    const tenant1Name = `test-tenant-${uuidv4().substring(0, 8)}`;
    const tenant2Name = `test-tenant-${uuidv4().substring(0, 8)}`;
    let tenant1Id, tenant2Id, tenant1ApiKey, tenant2ApiKey;
    
    console.log(`\n🔧 Creating test tenants: "${tenant1Name}" and "${tenant2Name}"`);
    
    // Step 1: Create first tenant
    console.log(`\n🧪 Test 1: Creating first tenant "${tenant1Name}"`);
    try {
      const tenant1Response = await axios.post(
        `${API_URL}/api/v1/admin/tenants`,
        {
          name: tenant1Name,
          displayName: `Test Tenant ${tenant1Name}`,
          description: 'Auto-created tenant for testing'
        },
        {
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        }
      );
      
      tenant1Id = tenant1Response.data.id;
      tenant1ApiKey = tenant1Response.data.apiKey;
      console.log(`✅ First tenant created successfully (ID: ${tenant1Id})`);
    } catch (error) {
      console.error('❌ Failed to create first tenant:', error.message);
      throw error;
    }
    
    // Step 2: Create second tenant
    console.log(`\n🧪 Test 2: Creating second tenant "${tenant2Name}"`);
    try {
      const tenant2Response = await axios.post(
        `${API_URL}/api/v1/admin/tenants`,
        {
          name: tenant2Name,
          displayName: `Test Tenant ${tenant2Name}`,
          description: 'Auto-created tenant for testing'
        },
        {
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        }
      );
      
      tenant2Id = tenant2Response.data.id;
      tenant2ApiKey = tenant2Response.data.apiKey;
      console.log(`✅ Second tenant created successfully (ID: ${tenant2Id})`);
    } catch (error) {
      console.error('❌ Failed to create second tenant:', error.message);
      throw error;
    }
    
    // Step 3: Authenticate as first tenant
    console.log(`\n🧪 Test 3: Authenticating as first tenant`);
    let tenant1Token;
    try {
      const tenant1AuthResponse = await axios.post(
        `${API_URL}/api/v1/auth/token`,
        {
          apiKey: tenant1ApiKey,
          tenantId: tenant1Id
        }
      );
      
      tenant1Token = tenant1AuthResponse.data.token;
      console.log(`✅ Authentication successful for first tenant`);
    } catch (error) {
      console.error('❌ Failed to authenticate as first tenant:', error.message);
      throw error;
    }
    
    // Step 4: Authenticate as second tenant
    console.log(`\n🧪 Test 4: Authenticating as second tenant`);
    let tenant2Token;
    try {
      const tenant2AuthResponse = await axios.post(
        `${API_URL}/api/v1/auth/token`,
        {
          apiKey: tenant2ApiKey,
          tenantId: tenant2Id
        }
      );
      
      tenant2Token = tenant2AuthResponse.data.token;
      console.log(`✅ Authentication successful for second tenant`);
    } catch (error) {
      console.error('❌ Failed to authenticate as second tenant:', error.message);
      throw error;
    }
    
    // Step 5: Create a feature flag in first tenant
    console.log(`\n🧪 Test 5: Creating a flag in first tenant`);
    const flagKey = `test-flag-${uuidv4().substring(0, 8)}`;
    try {
      await axios.post(
        `${API_URL}/api/v1/flags`,
        {
          key: flagKey,
          name: `Test Flag ${flagKey}`,
          description: 'Flag created for testing tenant isolation',
          enabled: true,
          type: 'boolean',
          defaultValue: true
        },
        {
          headers: {
            'Authorization': `Bearer ${tenant1Token}`,
            'X-Tenant-ID': tenant1Id
          }
        }
      );
      
      console.log(`✅ Flag "${flagKey}" created successfully in first tenant`);
    } catch (error) {
      console.error(`❌ Failed to create flag in first tenant:`, error.message);
      throw error;
    }
    
    // Step 6: Verify flag exists in first tenant
    console.log(`\n🧪 Test 6: Verifying flag exists in first tenant`);
    try {
      const flagResponse = await axios.get(
        `${API_URL}/api/v1/flags/${flagKey}`,
        {
          headers: {
            'Authorization': `Bearer ${tenant1Token}`,
            'X-Tenant-ID': tenant1Id
          }
        }
      );
      
      console.log(`✅ Flag "${flagKey}" found in first tenant`);
    } catch (error) {
      console.error(`❌ Failed to find flag in first tenant:`, error.message);
      throw error;
    }
    
    // Step 7: Try to access the flag from second tenant (should fail - isolation test)
    console.log(`\n🧪 Test 7: Testing tenant isolation - second tenant shouldn't see first tenant's flag`);
    try {
      await axios.get(
        `${API_URL}/api/v1/flags/${flagKey}`,
        {
          headers: {
            'Authorization': `Bearer ${tenant2Token}`,
            'X-Tenant-ID': tenant2Id
          }
        }
      );
      
      console.error(`❌ SECURITY ISSUE: Second tenant was able to access first tenant's flag!`);
    } catch (error) {
      console.log(`✅ Tenant isolation verified: Second tenant couldn't access first tenant's flag (${error.response?.status || 'Error'})`);
    }
    
    // Step 8: Admin can see both tenants
    console.log(`\n🧪 Test 8: Testing admin cross-tenant capabilities`);
    try {
      const tenantsResponse = await axios.get(
        `${API_URL}/api/v1/admin/tenants`,
        {
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        }
      );
      
      const tenants = tenantsResponse.data;
      const foundTenant1 = tenants.some(t => t.id === tenant1Id);
      const foundTenant2 = tenants.some(t => t.id === tenant2Id);
      
      if (foundTenant1 && foundTenant2) {
        console.log(`✅ Admin can view both tenants`);
      } else {
        console.log(`❌ Admin couldn't view all tenants: Found tenant1=${foundTenant1}, tenant2=${foundTenant2}`);
      }
    } catch (error) {
      console.error(`❌ Failed to test admin access:`, error.message);
    }
    
    // Step 9: Clean up - delete test tenants
    console.log(`\n🧹 Cleaning up test data - deleting test tenants`);
    try {
      await axios.delete(
        `${API_URL}/api/v1/admin/tenants/${tenant1Id}`,
        {
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        }
      );
      
      await axios.delete(
        `${API_URL}/api/v1/admin/tenants/${tenant2Id}`,
        {
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        }
      );
      
      console.log(`✅ Test tenants deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to clean up test tenants:`, error.message);
    }
    
    console.log('\n✅ Tenant provisioning and isolation test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

runTest().catch(console.error); 