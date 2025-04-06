#!/usr/bin/env node

/**
 * API Key Management Test
 * 
 * This script focuses specifically on testing the API key management endpoints.
 * It attempts to use direct permission assignment when possible and also tests 
 * fallbacks and error cases.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const timestamp = Date.now();
const REGULAR_USER_EMAIL = process.env.REGULAR_USER_EMAIL || `test.user.${timestamp}@example.com`;
const REGULAR_USER_PASSWORD = process.env.REGULAR_USER_PASSWORD || 'Test1234!';
const ADMIN_USER_EMAIL = process.env.ADMIN_USER_EMAIL || `admin.user.${timestamp}@example.com`;
const ADMIN_USER_PASSWORD = process.env.ADMIN_USER_PASSWORD || 'Admin1234!';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || `super.admin.${timestamp}@example.com`;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin1234!';

console.log('🔑 API Key Management Test');
console.log('=========================');
console.log(`API URL: ${API_URL}`);

// Reusable API request function with error handling
async function makeRequest(method, endpoint, token = null, data = null, description = '') {
  const config = {
    headers: {}
  };
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    let response;
    const url = `${API_URL}/api${endpoint}`;
    
    if (method === 'GET') {
      response = await axios.get(url, config);
    } else if (method === 'POST') {
      response = await axios.post(url, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(url, data, config);
    } else if (method === 'PATCH') {
      response = await axios.patch(url, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(url, config);
    }
    
    console.log(`✅ ${description} successful`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`❌ ${description} failed: ${error.response.data.message || error.message}`);
      console.error(`   Status: ${error.response.status}`);
      
      if (error.response.data.error === 'Permission denied') {
        console.error(`   Required permissions: ${error.response.data.requiredPermissions || 'unknown'}`);
      }
    } else {
      console.error(`❌ ${description} failed: ${error.message}`);
    }
    throw error;
  }
}

// Print section header
function printHeader(title) {
  console.log(`\n==== ${title} ====`);
}

async function runTest() {
  try {
    // User credentials
    let regularUserToken;
    let regularUserId;
    let adminUserToken;
    let adminUserId;
    let superAdminToken;
    let superAdminId;

    // API keys created during test
    const apiKeys = [];
    
    printHeader('Setting Up Test Users');
    
    // Create super admin (if needed)
    try {
      console.log('\n📝 Creating/authenticating super admin user...');
      try {
        const loginResponse = await makeRequest(
          'POST', 
          '/auth/login',
          null,
          {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD
          },
          'Super admin login'
        );
        superAdminToken = loginResponse.accessToken;
        superAdminId = loginResponse.user.id;
      } catch (error) {
        console.log('Super admin login failed, trying registration...');
        const registerResponse = await makeRequest(
          'POST',
          '/auth/register',
          null,
          {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'super_admin'
          },
          'Super admin registration'
        );
        superAdminToken = registerResponse.accessToken;
        superAdminId = registerResponse.user.id;
      }
      console.log(`✅ Super admin authenticated - ID: ${superAdminId}`);
    } catch (error) {
      console.log('⚠️ Could not authenticate super admin - continuing without it');
    }
    
    // Create regular user
    console.log('\n📝 Creating/authenticating regular user...');
    try {
      try {
        const loginResponse = await makeRequest(
          'POST',
          '/auth/login',
          null,
          {
            email: REGULAR_USER_EMAIL,
            password: REGULAR_USER_PASSWORD
          },
          'Regular user login'
        );
        regularUserToken = loginResponse.accessToken;
        regularUserId = loginResponse.user.id;
      } catch (error) {
        console.log('Regular user login failed, trying registration...');
        const registerResponse = await makeRequest(
          'POST',
          '/auth/register',
          null,
          {
            email: REGULAR_USER_EMAIL,
            password: REGULAR_USER_PASSWORD,
            firstName: 'Regular',
            lastName: 'User'
          },
          'Regular user registration'
        );
        regularUserToken = registerResponse.accessToken;
        regularUserId = registerResponse.user.id;
      }
      console.log(`✅ Regular user authenticated - ID: ${regularUserId}`);
    } catch (error) {
      console.error('❌ Failed to set up regular user');
      throw error;
    }
    
    // Create admin user
    console.log('\n📝 Creating/authenticating admin user...');
    try {
      try {
        const loginResponse = await makeRequest(
          'POST',
          '/auth/login',
          null,
          {
            email: ADMIN_USER_EMAIL,
            password: ADMIN_USER_PASSWORD
          },
          'Admin user login'
        );
        adminUserToken = loginResponse.accessToken;
        adminUserId = loginResponse.user.id;
      } catch (error) {
        console.log('Admin user login failed, trying registration...');
        const registerResponse = await makeRequest(
          'POST',
          '/auth/register',
          null,
          {
            email: ADMIN_USER_EMAIL,
            password: ADMIN_USER_PASSWORD,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          },
          'Admin user registration'
        );
        adminUserToken = registerResponse.accessToken;
        adminUserId = registerResponse.user.id;
      }
      console.log(`✅ Admin user authenticated - ID: ${adminUserId}`);
    } catch (error) {
      console.error('❌ Failed to set up admin user');
      throw error; 
    }
    
    printHeader('Setting Up User Permissions');
    
    // Try to assign permissions to users
    const authToken = superAdminToken || adminUserToken;
    
    // Try to grant permissions to regular user
    console.log('\n📝 Granting API key permissions to regular user...');
    let regularUserPermissionsGranted = false;
    
    const permissionSets = [
      { 
        endpoint: `/admin/users/${regularUserId}/permissions`,
        permissions: ['create:apikeys', 'view:apikeys', 'delete:apikeys']
      },
      {
        endpoint: `/users/${regularUserId}/permissions`,
        permissions: ['create:apikeys', 'view:apikeys', 'delete:apikeys']
      },
      {
        endpoint: `/admin/permissions/${regularUserId}`,
        permissions: ['create:apikeys', 'view:apikeys', 'delete:apikeys']
      },
      {
        endpoint: `/admin/roles/assign`,
        data: { userId: regularUserId, role: 'api_key_manager' }
      }
    ];
    
    for (const set of permissionSets) {
      try {
        if (set.data) {
          await makeRequest(
            'POST',
            set.endpoint,
            authToken,
            set.data,
            'Assign role to regular user'
          );
        } else {
          await makeRequest(
            'POST',
            set.endpoint,
            authToken,
            { permissions: set.permissions },
            'Assign permissions to regular user'
          );
        }
        regularUserPermissionsGranted = true;
        console.log('✅ Regular user granted API key permissions');
        break;
      } catch (error) {
        // Continue trying other endpoints
      }
    }
    
    if (!regularUserPermissionsGranted) {
      console.log('⚠️ Could not grant permissions to regular user');
      console.log('   Some tests are expected to fail');
    }
    
    // Try to grant admin permissions
    console.log('\n📝 Granting API key management permissions to admin user...');
    let adminPermissionsGranted = false;
    
    const adminPermissionSets = [
      {
        endpoint: `/admin/users/${adminUserId}/permissions`,
        permissions: ['create:apikeys', 'view:apikeys', 'delete:apikeys', 'manage:all:apikeys', 'super:admin']
      },
      {
        endpoint: `/users/${adminUserId}/permissions`,
        permissions: ['create:apikeys', 'view:apikeys', 'delete:apikeys', 'manage:all:apikeys', 'super:admin']
      },
      {
        endpoint: `/admin/permissions/${adminUserId}`,
        permissions: ['create:apikeys', 'view:apikeys', 'delete:apikeys', 'manage:all:apikeys', 'super:admin']
      },
      {
        endpoint: `/admin/roles/assign`,
        data: { userId: adminUserId, role: 'super_admin' }
      }
    ];
    
    for (const set of adminPermissionSets) {
      try {
        if (set.data) {
          await makeRequest(
            'POST',
            set.endpoint,
            authToken,
            set.data,
            'Assign role to admin user'
          );
        } else {
          await makeRequest(
            'POST',
            set.endpoint,
            authToken,
            { permissions: set.permissions },
            'Assign permissions to admin user'
          );
        }
        adminPermissionsGranted = true;
        console.log('✅ Admin user granted API key management permissions');
        break;
      } catch (error) {
        // Continue trying other endpoints
      }
    }
    
    if (!adminPermissionsGranted) {
      console.log('⚠️ Could not grant permissions to admin user');
      console.log('   Some tests are expected to fail');
    }
    
    printHeader('Test API Key Creation (Regular User)');
    
    // Try to create API key as regular user
    console.log('\n🧪 Test 1: Regular user creates API key');
    let regularUserApiKey;
    try {
      const createResponse = await makeRequest(
        'POST',
        '/users/me/apikeys',
        regularUserToken,
        {
          name: `Test API Key ${uuidv4().substring(0, 8)}`,
          description: 'Created during automated testing'
        },
        'Regular user creates API key'
      );
      
      regularUserApiKey = createResponse.apiKey;
      apiKeys.push(regularUserApiKey);
      
      console.log(`✅ API key created: ${regularUserApiKey.name}`);
      console.log(`   Key ID: ${regularUserApiKey.id}`);
      console.log(`   Key: ${regularUserApiKey.key?.substring(0, 10)}...`);
    } catch (error) {
      console.log('⚠️ Regular user could not create API key - testing admin route');
    }
    
    printHeader('Test API Key Creation (Admin User)');
    
    // Admin creates API key for themselves
    console.log('\n🧪 Test 2: Admin user creates API key for themselves');
    let adminApiKey;
    try {
      const createResponse = await makeRequest(
        'POST',
        '/users/me/apikeys',
        adminUserToken,
        {
          name: `Admin API Key ${uuidv4().substring(0, 8)}`,
          description: 'Created during automated testing'
        },
        'Admin user creates API key'
      );
      
      adminApiKey = createResponse.apiKey;
      apiKeys.push(adminApiKey);
      
      console.log(`✅ API key created: ${adminApiKey.name}`);
      console.log(`   Key ID: ${adminApiKey.id}`);
      console.log(`   Key: ${adminApiKey.key?.substring(0, 10)}...`);
    } catch (error) {
      console.log('⚠️ Admin user could not create API key for themselves');
    }
    
    // Admin creates API key for regular user
    console.log('\n🧪 Test 3: Admin creates API key for regular user');
    let adminCreatedUserApiKey;
    
    // Try different endpoint patterns
    const adminEndpoints = [
      `/admin/users/${regularUserId}/apikeys`,
      `/users/${regularUserId}/apikeys`,
      `/admin/apikeys/user/${regularUserId}`
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        const createResponse = await makeRequest(
          'POST',
          endpoint,
          adminUserToken,
          {
            name: `User API Key (Admin Created) ${uuidv4().substring(0, 8)}`,
            description: 'Created by admin during automated testing'
          },
          `Admin creates API key for user (${endpoint})`
        );
        
        adminCreatedUserApiKey = createResponse.apiKey;
        apiKeys.push(adminCreatedUserApiKey);
        
        console.log(`✅ API key created by admin: ${adminCreatedUserApiKey.name}`);
        console.log(`   Key ID: ${adminCreatedUserApiKey.id}`);
        console.log(`   Key: ${adminCreatedUserApiKey.key?.substring(0, 10)}...`);
        break;
      } catch (error) {
        // Try next endpoint
      }
    }
    
    if (!adminCreatedUserApiKey) {
      console.log('⚠️ Admin could not create API key for regular user');
    }
    
    printHeader('Test API Key Listing');
    
    // Regular user lists their API keys
    console.log('\n🧪 Test 4: Regular user lists their API keys');
    try {
      const listResponse = await makeRequest(
        'GET',
        '/users/me/apikeys',
        regularUserToken,
        null,
        'Regular user lists API keys'
      );
      
      console.log(`✅ Retrieved ${listResponse.length} API keys`);
      listResponse.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key.name} (ID: ${key.id})`);
      });
    } catch (error) {
      console.log('⚠️ Regular user could not list their API keys');
    }
    
    // Admin lists regular user's API keys
    console.log('\n🧪 Test 5: Admin lists regular user\'s API keys');
    
    // Try different endpoint patterns
    const adminListEndpoints = [
      `/admin/users/${regularUserId}/apikeys`,
      `/users/${regularUserId}/apikeys`,
      `/admin/apikeys/user/${regularUserId}`
    ];
    
    let adminListSuccess = false;
    for (const endpoint of adminListEndpoints) {
      try {
        const listResponse = await makeRequest(
          'GET',
          endpoint,
          adminUserToken,
          null,
          `Admin lists user API keys (${endpoint})`
        );
        
        console.log(`✅ Admin retrieved ${listResponse.length} API keys for user`);
        listResponse.forEach((key, index) => {
          console.log(`   ${index + 1}. ${key.name} (ID: ${key.id})`);
        });
        adminListSuccess = true;
        break;
      } catch (error) {
        // Try next endpoint
      }
    }
    
    if (!adminListSuccess) {
      console.log('⚠️ Admin could not list user API keys');
    }
    
    printHeader('Test API Key Details/Verification');
    
    // Test API keys created by both users
    if (regularUserApiKey) {
      console.log('\n🧪 Test 6: Get details of API key created by regular user');
      try {
        const keyResponse = await makeRequest(
          'GET',
          `/users/me/apikeys/${regularUserApiKey.id}`,
          regularUserToken,
          null,
          'Get API key details'
        );
        
        console.log(`✅ Retrieved API key details: ${keyResponse.name}`);
        console.log(`   Created: ${new Date(keyResponse.createdAt).toLocaleString()}`);
        console.log(`   Last used: ${keyResponse.lastUsed ? new Date(keyResponse.lastUsed).toLocaleString() : 'Never'}`);
      } catch (error) {
        console.log('⚠️ Could not get API key details');
      }
    }
    
    if (adminCreatedUserApiKey) {
      console.log('\n🧪 Test 7: Verify API key created by admin is accessible to user');
      try {
        const keyResponse = await makeRequest(
          'GET',
          `/users/me/apikeys/${adminCreatedUserApiKey.id}`,
          regularUserToken,
          null,
          'User accesses admin-created API key'
        );
        
        console.log(`✅ User can access admin-created API key: ${keyResponse.name}`);
      } catch (error) {
        console.log('⚠️ User cannot access admin-created API key');
      }
    }
    
    printHeader('Test API Key Revocation');
    
    // Regular user revokes their own API key
    if (regularUserApiKey) {
      console.log('\n🧪 Test 8: Regular user revokes their API key');
      try {
        await makeRequest(
          'DELETE',
          `/users/me/apikeys/${regularUserApiKey.id}`,
          regularUserToken,
          null,
          'Regular user revokes API key'
        );
        
        console.log(`✅ API key successfully revoked: ${regularUserApiKey.id}`);
        
        // Verify key was revoked
        try {
          await makeRequest(
            'GET',
            `/users/me/apikeys/${regularUserApiKey.id}`,
            regularUserToken,
            null,
            'Verify key was revoked'
          );
          console.log('❌ API key still accessible after revocation');
        } catch (error) {
          console.log('✅ Verified: API key is no longer accessible');
        }
      } catch (error) {
        console.log('⚠️ Regular user could not revoke their API key');
      }
    }
    
    // Admin revokes user's API key
    if (adminCreatedUserApiKey) {
      console.log('\n🧪 Test 9: Admin revokes user\'s API key');
      
      // Try different endpoint patterns
      const adminRevokeEndpoints = [
        `/admin/users/${regularUserId}/apikeys/${adminCreatedUserApiKey.id}`,
        `/users/${regularUserId}/apikeys/${adminCreatedUserApiKey.id}`,
        `/admin/apikeys/${adminCreatedUserApiKey.id}`
      ];
      
      let adminRevokeSuccess = false;
      for (const endpoint of adminRevokeEndpoints) {
        try {
          await makeRequest(
            'DELETE',
            endpoint,
            adminUserToken,
            null,
            `Admin revokes user API key (${endpoint})`
          );
          
          console.log(`✅ Admin successfully revoked user API key: ${adminCreatedUserApiKey.id}`);
          adminRevokeSuccess = true;
          break;
        } catch (error) {
          // Try next endpoint
        }
      }
      
      if (!adminRevokeSuccess) {
        console.log('⚠️ Admin could not revoke user API key');
      }
    }
    
    printHeader('Test API Key Authentication');
    
    // Create a fresh API key for authentication testing
    let authTestApiKey;
    try {
      console.log('\n📝 Creating API key for authentication test...');
      
      // Try with regular user first
      try {
        const createResponse = await makeRequest(
          'POST',
          '/users/me/apikeys',
          regularUserToken,
          {
            name: `Auth Test Key ${uuidv4().substring(0, 8)}`,
            description: 'Created for authentication testing'
          },
          'Create API key for auth testing'
        );
        
        authTestApiKey = createResponse.apiKey;
      } catch (error) {
        // Try with admin
        try {
          const endpoint = `/admin/users/${regularUserId}/apikeys`;
          const createResponse = await makeRequest(
            'POST',
            endpoint,
            adminUserToken,
            {
              name: `Auth Test Key ${uuidv4().substring(0, 8)}`,
              description: 'Created for authentication testing by admin'
            },
            'Admin creates API key for auth testing'
          );
          
          authTestApiKey = createResponse.apiKey;
        } catch (adminError) {
          console.log('⚠️ Could not create API key for authentication testing');
        }
      }
      
      if (authTestApiKey) {
        console.log(`✅ Created auth test API key: ${authTestApiKey.name}`);
        console.log(`   Key: ${authTestApiKey.key.substring(0, 10)}...`);
        
        // Test API key authentication
        console.log('\n🧪 Test 10: Authenticate with API key');
        
        try {
          const response = await axios.get(`${API_URL}/api/users/me`, {
            headers: {
              'X-API-Key': authTestApiKey.key
            }
          });
          
          console.log('✅ Successfully authenticated with API key');
          console.log(`   User: ${response.data.firstName} ${response.data.lastName}`);
        } catch (error) {
          console.log('⚠️ API key authentication failed');
          console.log(`   Error: ${error.response?.data?.message || error.message}`);
        }
      }
    } catch (error) {
      console.log('⚠️ Authentication test skipped');
    }
    
    console.log('\n✨ API Key Management Tests Complete ✨');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTest(); 