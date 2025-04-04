#!/usr/bin/env node

/**
 * Multi-Tenant Architecture Test
 * 
 * This script tests the multi-tenant architecture with multiple concurrent tenants:
 * 1. Create multiple test tenants
 * 2. Send concurrent requests from different tenants
 * 3. Verify proper request routing and tenant isolation
 * 4. Test cross-tenant admin operations
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'replace-with-admin-token';
const NUM_TENANTS = 3; // Number of test tenants to create
const CONCURRENT_REQUESTS = 5; // Number of concurrent requests per tenant

console.log('🏢 Multi-Tenant Architecture Test');
console.log('===============================');
console.log(`API URL: ${API_URL}`);
console.log(`Test tenants: ${NUM_TENANTS}`);
console.log(`Concurrent requests per tenant: ${CONCURRENT_REQUESTS}`);

async function runTest() {
  try {
    const tenants = [];
    
    // Step 1: Create multiple test tenants
    console.log('\n🧪 Test 1: Creating multiple test tenants');
    for (let i = 0; i < NUM_TENANTS; i++) {
      const tenantName = `test-tenant-${uuidv4().substring(0, 8)}`;
      try {
        const response = await axios.post(
          `${API_URL}/api/v1/admin/tenants`,
          {
            name: tenantName,
            displayName: `Test Tenant ${i + 1}`,
            description: 'Created for multi-tenant architecture testing'
          },
          {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
          }
        );
        
        const tenant = {
          id: response.data.id,
          name: tenantName,
          apiKey: response.data.apiKey,
          token: null,
          flags: []
        };
        
        tenants.push(tenant);
        console.log(`✅ Created tenant ${i + 1}/${NUM_TENANTS} (ID: ${tenant.id})`);
      } catch (error) {
        console.error(`❌ Failed to create tenant ${i + 1}:`, error.message);
        throw error;
      }
    }
    
    // Step 2: Authenticate each tenant
    console.log('\n🧪 Test 2: Authenticating tenants');
    for (let i = 0; i < tenants.length; i++) {
      try {
        const response = await axios.post(
          `${API_URL}/api/v1/auth/token`,
          {
            apiKey: tenants[i].apiKey,
            tenantId: tenants[i].id
          }
        );
        
        tenants[i].token = response.data.token;
        console.log(`✅ Authenticated tenant ${i + 1}/${tenants.length}`);
      } catch (error) {
        console.error(`❌ Failed to authenticate tenant ${i + 1}:`, error.message);
        throw error;
      }
    }
    
    // Step 3: Create unique flags for each tenant
    console.log('\n🧪 Test 3: Creating unique flags for each tenant');
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      
      for (let j = 0; j < 3; j++) {
        const flagKey = `test-flag-${tenant.name}-${j}`;
        try {
          const response = await axios.post(
            `${API_URL}/api/v1/flags`,
            {
              key: flagKey,
              name: `Test Flag ${j + 1} for ${tenant.name}`,
              description: 'Created for multi-tenant testing',
              type: 'boolean',
              enabled: true,
              defaultValue: j % 2 === 0 // alternate true/false
            },
            {
              headers: {
                'Authorization': `Bearer ${tenant.token}`,
                'X-Tenant-ID': tenant.id
              }
            }
          );
          
          tenant.flags.push({
            id: response.data.id,
            key: flagKey
          });
          
          console.log(`✅ Created flag ${j + 1}/3 for tenant ${i + 1}`);
        } catch (error) {
          console.error(`❌ Failed to create flag ${j + 1} for tenant ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    // Step 4: Test tenant isolation - Try accessing flags across tenants
    console.log('\n🧪 Test 4: Testing tenant isolation');
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      const otherTenant = tenants[(i + 1) % tenants.length]; // next tenant in the list
      
      // Try to access another tenant's flag
      try {
        await axios.get(
          `${API_URL}/api/v1/flags/${otherTenant.flags[0].key}`,
          {
            headers: {
              'Authorization': `Bearer ${tenant.token}`,
              'X-Tenant-ID': tenant.id
            }
          }
        );
        
        console.error(`❌ SECURITY ISSUE: Tenant ${i + 1} was able to access another tenant's flag!`);
      } catch (error) {
        console.log(`✅ Tenant isolation working: Tenant ${i + 1} couldn't access Tenant ${(i + 1) % tenants.length + 1}'s flag`);
      }
    }
    
    // Step 5: Send concurrent requests from different tenants
    console.log('\n🧪 Test 5: Testing concurrent multi-tenant requests');
    
    const allRequests = [];
    
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      
      for (let j = 0; j < CONCURRENT_REQUESTS; j++) {
        // Randomly select one of the tenant's flags
        const randomFlagIndex = Math.floor(Math.random() * tenant.flags.length);
        const flag = tenant.flags[randomFlagIndex];
        
        const request = axios.post(
          `${API_URL}/api/v1/evaluation/${flag.key}`,
          { userId: `user-${j}`, group: 'test' },
          {
            headers: {
              'Authorization': `Bearer ${tenant.token}`,
              'X-Tenant-ID': tenant.id
            }
          }
        ).then(response => {
          return {
            tenantId: tenant.id,
            flagKey: flag.key,
            success: true,
            value: response.data.value
          };
        }).catch(error => {
          return {
            tenantId: tenant.id,
            flagKey: flag.key,
            success: false,
            error: error.message
          };
        });
        
        allRequests.push(request);
      }
    }
    
    const results = await Promise.all(allRequests);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Completed ${successCount}/${results.length} concurrent requests successfully`);
    
    if (successCount < results.length) {
      console.error(`❌ ${results.length - successCount} requests failed`);
      console.error(results.filter(r => !r.success).slice(0, 3)); // Show first 3 failures
    }
    
    // Step 6: Test admin cross-tenant access
    console.log('\n🧪 Test 6: Testing admin cross-tenant operations');
    try {
      const allFlagsResponse = await axios.get(
        `${API_URL}/api/v1/admin/flags`,
        {
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        }
      );
      
      const allFlags = allFlagsResponse.data;
      
      // Check if admin can see flags from all tenants
      let allTenantsFound = true;
      for (const tenant of tenants) {
        const tenantFlagsFound = tenant.flags.every(tf => 
          allFlags.some(f => f.id === tf.id || f.key === tf.key)
        );
        
        if (!tenantFlagsFound) {
          allTenantsFound = false;
          console.error(`❌ Admin couldn't see all flags for tenant ${tenant.id}`);
        }
      }
      
      if (allTenantsFound) {
        console.log(`✅ Admin can view flags across all tenants`);
      }
    } catch (error) {
      console.error(`❌ Failed to test admin cross-tenant access:`, error.message);
    }
    
    // Step 7: Clean up - delete test tenants
    console.log('\n🧹 Cleaning up - deleting test tenants');
    for (let i = 0; i < tenants.length; i++) {
      try {
        await axios.delete(
          `${API_URL}/api/v1/admin/tenants/${tenants[i].id}`,
          {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
          }
        );
        
        console.log(`✅ Deleted tenant ${i + 1}/${tenants.length}`);
      } catch (error) {
        console.error(`❌ Failed to delete tenant ${i + 1}:`, error.message);
      }
    }
    
    console.log('\n✅ Multi-tenant architecture test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

runTest().catch(console.error); 