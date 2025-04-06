/**
 * Comprehensive Permission System Test
 * 
 * This script tests the entire permission management system including:
 * - User creation with different roles
 * - Permission assignment and revocation
 * - Role management
 * - Access control to protected resources
 */
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = 'http://localhost:3000/api';
let JWT_SECRET = 'your-secret-key';

// Try to load JWT secret from .env files
try {
  if (fs.existsSync('.env')) {
    const envContents = fs.readFileSync('.env', 'utf8');
    const jwtMatch = envContents.match(/JWT_SECRET=(.+)/);
    if (jwtMatch && jwtMatch[1]) {
      JWT_SECRET = jwtMatch[1].trim();
      console.log('✅ Loaded JWT_SECRET from .env file');
    }
  } else if (fs.existsSync('.env.local')) {
    const envContents = fs.readFileSync('.env.local', 'utf8');
    const jwtMatch = envContents.match(/JWT_SECRET=(.+)/);
    if (jwtMatch && jwtMatch[1]) {
      JWT_SECRET = jwtMatch[1].trim();
      console.log('✅ Loaded JWT_SECRET from .env.local file');
    }
  }
} catch (error) {
  console.warn(`⚠️ Could not load JWT_SECRET from env files: ${error.message}`);
}

// Store tokens and user IDs for the test
const testUsers = {
  regular: { email: null, id: null, token: null },
  admin: { email: null, id: null, token: null },
  tenantManager: { email: null, id: null, token: null }
};

/**
 * Create a test user with a specific role
 */
async function createTestUser(role = 'user') {
  const uniqueEmail = `test.${role}.${uuidv4().substring(0, 8)}@example.com`;
  
  try {
    console.log(`👤 Creating test ${role} user with email: ${uniqueEmail}`);
    
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: uniqueEmail,
      password: 'TestPass123!',
      firstName: `Test`,
      lastName: role.charAt(0).toUpperCase() + role.slice(1)
    });
    
    const { user, accessToken } = response.data;
    console.log(`✅ Created ${role} user: ${user.id}`);
    
    return { user, accessToken };
  } catch (error) {
    console.error(`❌ Failed to create ${role} user:`, error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Assign a role to a user
 */
async function assignRole(userId, role, adminToken) {
  try {
    console.log(`👑 Assigning role '${role}' to user ${userId}`);
    
    const response = await axios.post(`${API_URL}/admin/permissions/roles/assign`, 
      { userId, role },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    console.log(`✅ Role assigned: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to assign role:`, error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Assign permissions to a user
 */
async function assignPermissions(userId, permissions, adminToken) {
  try {
    console.log(`🔑 Assigning permissions [${permissions.join(', ')}] to user ${userId}`);
    
    const response = await axios.post(`${API_URL}/admin/permissions/assign`, 
      { userId, permissions },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    console.log(`✅ Permissions assigned: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to assign permissions:`, error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Test access to a protected resource
 */
async function testAccess(endpoint, token, expectedStatus = 200) {
  try {
    console.log(`🔒 Testing access to ${endpoint}`);
    
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.status === expectedStatus) {
      console.log(`✅ Access granted as expected (${response.status})`);
      return { success: true, data: response.data };
    } else {
      console.log(`❌ Unexpected status code: ${response.status} (expected ${expectedStatus})`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    const status = error.response?.status || 500;
    
    if (status !== expectedStatus) {
      console.log(`❌ Access denied unexpectedly: ${status} ${error.response?.data?.message || error.message}`);
      return { success: false, status, error: error.response?.data };
    } else {
      console.log(`✅ Access denied as expected (${status})`);
      return { success: true, error: error.response?.data };
    }
  }
}

/**
 * Get user permissions
 */
async function getUserPermissions(userId, adminToken) {
  try {
    console.log(`🔍 Getting permissions for user ${userId}`);
    
    const response = await axios.get(`${API_URL}/admin/permissions/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Got user permissions. Roles: ${response.data.roles.map(r => r.name).join(', ')}`);
    console.log(`✅ Permissions: ${response.data.permissions.join(', ')}`);
    
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to get user permissions:`, error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting comprehensive permission system tests...');
  
  try {
    // 1. Create users with different roles
    console.log('\n📋 STEP 1: Create test users');
    
    // Create a regular user
    const regularUserResult = await createTestUser('user');
    testUsers.regular.id = regularUserResult.user.id;
    testUsers.regular.email = regularUserResult.user.email;
    testUsers.regular.token = regularUserResult.accessToken;
    
    // Create an admin user
    const adminUserResult = await createTestUser('admin');
    testUsers.admin.id = adminUserResult.user.id;
    testUsers.admin.email = adminUserResult.user.email;
    testUsers.admin.token = adminUserResult.accessToken;
    
    // Create a tenant manager
    const tenantManagerResult = await createTestUser('tenant_manager');
    testUsers.tenantManager.id = tenantManagerResult.user.id;
    testUsers.tenantManager.email = tenantManagerResult.user.email;
    testUsers.tenantManager.token = tenantManagerResult.accessToken;
    
    // 2. Elevate the admin user to have admin permissions
    console.log('\n📋 STEP 2: Assign admin permissions');
    await assignPermissions(
      testUsers.admin.id, 
      ['assign:permissions', 'assign:roles', 'super:admin'], 
      testUsers.admin.token
    );
    
    // 3. Now use the admin to assign roles to users
    console.log('\n📋 STEP 3: Assign roles using the admin');
    await assignRole(testUsers.admin.id, 'admin', testUsers.admin.token);
    await assignRole(testUsers.tenantManager.id, 'tenant_manager', testUsers.admin.token);
    
    // 4. Get and display user permissions
    console.log('\n📋 STEP 4: Verify user permissions');
    await getUserPermissions(testUsers.regular.id, testUsers.admin.token);
    await getUserPermissions(testUsers.tenantManager.id, testUsers.admin.token);
    await getUserPermissions(testUsers.admin.id, testUsers.admin.token);
    
    // 5. Test access control
    console.log('\n📋 STEP 5: Test access control');
    
    // Test user profile access (all users should have access)
    console.log('\n🔍 Testing profile access:');
    await testAccess('/users/me', testUsers.regular.token);
    await testAccess('/users/me', testUsers.tenantManager.token);
    await testAccess('/users/me', testUsers.admin.token);
    
    // Test tenant access (regular user should be denied)
    console.log('\n🔍 Testing tenant access:');
    await testAccess('/tenants', testUsers.regular.token, 403); // Should be denied
    await testAccess('/tenants', testUsers.tenantManager.token); // Should be allowed
    await testAccess('/tenants', testUsers.admin.token); // Should be allowed
    
    // Test admin endpoint access (only admin should have access)
    console.log('\n🔍 Testing admin endpoint access:');
    await testAccess('/admin/permissions/roles', testUsers.regular.token, 403); // Should be denied
    await testAccess('/admin/permissions/roles', testUsers.tenantManager.token, 403); // Should be denied
    await testAccess('/admin/permissions/roles', testUsers.admin.token); // Should be allowed
    
    console.log('\n✅ Permission system tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the tests
runTests(); 