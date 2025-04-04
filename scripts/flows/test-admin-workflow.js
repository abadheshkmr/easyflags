#!/usr/bin/env node

/**
 * Admin Workflow Test
 * 
 * This script tests the backend API endpoints that support the Admin UI workflow:
 * 1. Admin authentication
 * 2. Tenant management (list, create, update, delete)
 * 3. Flag management (list, create, update, delete, toggle)
 * 4. User management (list, create, update, delete)
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'replace-with-admin-password';

console.log('🧰 Admin Workflow Test');
console.log('====================');
console.log(`API URL: ${API_URL}`);

async function runTest() {
  try {
    let adminToken;
    let testTenantId;
    let testFlagId;
    let testUserId;
    
    // Step 1: Admin Login
    console.log('\n🧪 Test 1: Admin Authentication');
    try {
      const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      
      adminToken = loginResponse.data.token;
      console.log('✅ Admin login successful');
    } catch (error) {
      console.error('❌ Admin login failed:', error.message);
      throw error;
    }
    
    // Step 2: List Tenants (Dashboard -> Tenants)
    console.log('\n🧪 Test 2: Listing Tenants');
    try {
      const tenantsResponse = await axios.get(
        `${API_URL}/api/v1/admin/tenants`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      const tenants = tenantsResponse.data;
      console.log(`✅ Retrieved ${tenants.length} tenants`);
    } catch (error) {
      console.error('❌ Failed to list tenants:', error.message);
      throw error;
    }
    
    // Step 3: Create New Tenant (TenantList -> CreateTenant)
    console.log('\n🧪 Test 3: Creating a New Tenant');
    const testTenantName = `test-tenant-${uuidv4().substring(0, 8)}`;
    try {
      const createTenantResponse = await axios.post(
        `${API_URL}/api/v1/admin/tenants`,
        {
          name: testTenantName,
          displayName: `Test Tenant ${testTenantName}`,
          description: 'Created for testing admin workflow'
        },
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      testTenantId = createTenantResponse.data.id;
      console.log(`✅ Created test tenant (ID: ${testTenantId})`);
    } catch (error) {
      console.error('❌ Failed to create test tenant:', error.message);
      throw error;
    }
    
    // Step 4: Get Tenant Details (TenantList -> TenantDetails)
    console.log('\n🧪 Test 4: Viewing Tenant Details');
    try {
      const tenantDetailsResponse = await axios.get(
        `${API_URL}/api/v1/admin/tenants/${testTenantId}`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      console.log(`✅ Retrieved tenant details for "${tenantDetailsResponse.data.name}"`);
    } catch (error) {
      console.error('❌ Failed to get tenant details:', error.message);
      throw error;
    }
    
    // Step 5: Update Tenant (TenantDetails -> EditTenant)
    console.log('\n🧪 Test 5: Updating Tenant Details');
    try {
      await axios.put(
        `${API_URL}/api/v1/admin/tenants/${testTenantId}`,
        {
          displayName: `Updated Test Tenant ${testTenantName}`,
          description: 'Updated description for testing'
        },
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      console.log('✅ Updated tenant details');
    } catch (error) {
      console.error('❌ Failed to update tenant details:', error.message);
      throw error;
    }
    
    // Step 6: List Flags for Tenant (Dashboard -> Flags)
    console.log('\n🧪 Test 6: Listing Flags for Tenant');
    try {
      const flagsResponse = await axios.get(
        `${API_URL}/api/v1/admin/tenants/${testTenantId}/flags`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      const flags = flagsResponse.data;
      console.log(`✅ Retrieved ${flags.length} flags for the tenant`);
    } catch (error) {
      console.error('❌ Failed to list flags:', error.message);
      throw error;
    }
    
    // Step 7: Create Flag (FlagList -> CreateFlag)
    console.log('\n🧪 Test 7: Creating a New Flag');
    const testFlagKey = `test-flag-${uuidv4().substring(0, 8)}`;
    try {
      const createFlagResponse = await axios.post(
        `${API_URL}/api/v1/flags`,
        {
          key: testFlagKey,
          name: `Test Flag ${testFlagKey}`,
          description: 'Created for testing admin workflow',
          type: 'boolean',
          enabled: true,
          defaultValue: false
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Tenant-ID': testTenantId
          }
        }
      );
      
      testFlagId = createFlagResponse.data.id;
      console.log(`✅ Created test flag (ID: ${testFlagId})`);
    } catch (error) {
      console.error('❌ Failed to create test flag:', error.message);
      throw error;
    }
    
    // Step 8: Get Flag Details (FlagList -> FlagDetails)
    console.log('\n🧪 Test 8: Viewing Flag Details');
    try {
      const flagDetailsResponse = await axios.get(
        `${API_URL}/api/v1/flags/${testFlagKey}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Tenant-ID': testTenantId
          }
        }
      );
      
      console.log(`✅ Retrieved flag details for "${flagDetailsResponse.data.key}"`);
    } catch (error) {
      console.error('❌ Failed to get flag details:', error.message);
      throw error;
    }
    
    // Step 9: Update Flag (FlagDetails -> EditFlag)
    console.log('\n🧪 Test 9: Updating Flag Details');
    try {
      await axios.put(
        `${API_URL}/api/v1/flags/${testFlagKey}`,
        {
          name: `Updated Test Flag ${testFlagKey}`,
          description: 'Updated description for testing'
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Tenant-ID': testTenantId
          }
        }
      );
      
      console.log('✅ Updated flag details');
    } catch (error) {
      console.error('❌ Failed to update flag details:', error.message);
      throw error;
    }
    
    // Step 10: Toggle Flag (FlagDetails -> ToggleFlag)
    console.log('\n🧪 Test 10: Toggling Flag Status');
    try {
      await axios.patch(
        `${API_URL}/api/v1/flags/${testFlagKey}/toggle`,
        { enabled: false },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Tenant-ID': testTenantId
          }
        }
      );
      
      console.log('✅ Toggled flag status to disabled');
    } catch (error) {
      console.error('❌ Failed to toggle flag status:', error.message);
      throw error;
    }
    
    // Step 11: List Users (Dashboard -> Users)
    console.log('\n🧪 Test 11: Listing Users');
    try {
      const usersResponse = await axios.get(
        `${API_URL}/api/v1/admin/users`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      const users = usersResponse.data;
      console.log(`✅ Retrieved ${users.length} users`);
    } catch (error) {
      console.error('❌ Failed to list users:', error.message);
      throw error;
    }
    
    // Step 12: Create User (UserList -> CreateUser)
    console.log('\n🧪 Test 12: Creating a New User');
    const testUserEmail = `test-user-${uuidv4().substring(0, 8)}@example.com`;
    try {
      const createUserResponse = await axios.post(
        `${API_URL}/api/v1/admin/users`,
        {
          email: testUserEmail,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          tenantId: testTenantId
        },
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      testUserId = createUserResponse.data.id;
      console.log(`✅ Created test user (ID: ${testUserId})`);
    } catch (error) {
      console.error('❌ Failed to create test user:', error.message);
      throw error;
    }
    
    // Step 13: Clean Up - Delete Flag
    console.log('\n🧹 Cleaning up - Deleting test flag');
    try {
      await axios.delete(
        `${API_URL}/api/v1/flags/${testFlagKey}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Tenant-ID': testTenantId
          }
        }
      );
      
      console.log('✅ Deleted test flag');
    } catch (error) {
      console.error('❌ Failed to delete test flag:', error.message);
    }
    
    // Step 14: Clean Up - Delete User
    console.log('\n🧹 Cleaning up - Deleting test user');
    try {
      await axios.delete(
        `${API_URL}/api/v1/admin/users/${testUserId}`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      console.log('✅ Deleted test user');
    } catch (error) {
      console.error('❌ Failed to delete test user:', error.message);
    }
    
    // Step 15: Clean Up - Delete Tenant
    console.log('\n🧹 Cleaning up - Deleting test tenant');
    try {
      await axios.delete(
        `${API_URL}/api/v1/admin/tenants/${testTenantId}`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      
      console.log('✅ Deleted test tenant');
    } catch (error) {
      console.error('❌ Failed to delete test tenant:', error.message);
    }
    
    console.log('\n✅ Admin workflow test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

runTest().catch(console.error); 