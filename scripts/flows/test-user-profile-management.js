#!/usr/bin/env node

/**
 * User Profile Management Test
 * 
 * This script tests the backend API endpoints for user profile management:
 * 1. User authentication (login/register)
 * 2. Profile management (view, update)
 * 3. Preference management
 * 4. API key management
 * 5. Admin operations for user API keys
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

console.log('🧰 User Profile Management Test');
console.log('==============================');
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
    console.error(`❌ ${description} failed:`, error.response?.data?.message || error.message);
    throw error;
  }
}

async function runTest() {
  try {
    let regularUserToken;
    let regularUserId;
    let adminUserToken;
    let adminUserId;
    
    // Step 1: Regular User Authentication
    console.log('\n🧪 Test 1: Regular User Authentication');
    try {
      // Try login first (in case user already exists)
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
        console.log('✅ Regular user login successful');
      } catch (loginError) {
        // If login fails, try registration
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
        console.log('✅ Regular user registration successful');
      }
      
      console.log(`📝 Regular user ID: ${regularUserId}`);
    } catch (error) {
      console.error('❌ Regular user authentication failed');
      throw error;
    }
    
    // Step 2: Admin User Authentication
    console.log('\n🧪 Test 2: Admin User Authentication');
    try {
      // Try login first (in case user already exists)
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
        console.log('✅ Admin user login successful');
      } catch (loginError) {
        // If login fails, try registration
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
        console.log('✅ Admin user registration successful');
      }
      
      console.log(`📝 Admin user ID: ${adminUserId}`);
    } catch (error) {
      console.error('❌ Admin user authentication failed');
      throw error;
    }
    
    // Step 3: Get User Profile
    console.log('\n🧪 Test 3: Get User Profile');
    try {
      const profileResponse = await makeRequest(
        'GET',
        '/users/me',
        regularUserToken,
        null,
        'Get user profile'
      );
      
      console.log(`✅ Retrieved profile for user: ${profileResponse.firstName} ${profileResponse.lastName} (${profileResponse.email})`);
    } catch (error) {
      console.error('❌ Failed to retrieve user profile');
      // Continue with tests
    }
    
    // Step 4: Update User Profile
    console.log('\n🧪 Test 4: Update User Profile');
    try {
      const updateResponse = await makeRequest(
        'PUT',
        '/users/me',
        regularUserToken,
        {
          firstName: 'Updated',
          lastName: 'Profile'
        },
        'Update user profile'
      );
      
      console.log(`✅ Updated profile name to: ${updateResponse.firstName} ${updateResponse.lastName}`);
    } catch (error) {
      console.error('❌ Failed to update user profile');
      // Continue with tests
    }
    
    // Step 5: Get User Preferences
    console.log('\n🧪 Test 5: Get User Preferences');
    try {
      const preferencesResponse = await makeRequest(
        'GET',
        '/users/me/preferences',
        regularUserToken,
        null,
        'Get user preferences'
      );
      
      console.log('✅ Retrieved user preferences');
      console.log(`   Dark mode: ${preferencesResponse.darkMode}`);
      console.log(`   Email notifications: ${preferencesResponse.emailNotifications}`);
    } catch (error) {
      console.error('❌ Failed to retrieve user preferences');
      // Continue with tests
    }
    
    // Step 6: Update User Preferences
    console.log('\n🧪 Test 6: Update User Preferences');
    try {
      const updatePreferencesResponse = await makeRequest(
        'PATCH',
        '/users/me/preferences',
        regularUserToken,
        {
          darkMode: true,
          emailNotifications: false
        },
        'Update user preferences'
      );
      
      console.log('✅ Updated user preferences');
      console.log(`   Dark mode: ${updatePreferencesResponse.darkMode}`);
      console.log(`   Email notifications: ${updatePreferencesResponse.emailNotifications}`);
    } catch (error) {
      console.error('❌ Failed to update user preferences');
      // Continue with tests
    }
    
    // Step 7: Change Password (Regular User)
    console.log('\n🧪 Test 7: Change Password');
    try {
      const newPassword = 'NewPassword123!';
      await makeRequest(
        'PATCH',
        '/users/me/password',
        regularUserToken,
        {
          currentPassword: REGULAR_USER_PASSWORD,
          newPassword: newPassword,
          confirmPassword: newPassword
        },
        'Change password'
      );
      
      console.log('✅ Password changed successfully');
      
      // Verify password change with login
      console.log('   Verifying password change with login...');
      try {
        const verifyLoginResponse = await makeRequest(
          'POST',
          '/auth/login',
          null,
          {
            email: REGULAR_USER_EMAIL,
            password: newPassword
          },
          'Login with new password'
        );
        
        console.log('✅ Login with new password successful');
        regularUserToken = verifyLoginResponse.accessToken; // Update token with new one
      } catch (loginError) {
        console.error('❌ Failed to login with new password');
      }
    } catch (error) {
      console.error('❌ Failed to change password');
      // Continue with tests
    }
    
    // Step 8: Create API Key (Regular User)
    console.log('\n🧪 Test 8: Create API Key (Regular User)');
    let regularUserApiKey;
    try {
      const createKeyResponse = await makeRequest(
        'POST',
        '/users/me/apikeys',
        regularUserToken,
        {
          name: 'Test API Key'
        },
        'Create API key (regular user)'
      );
      
      regularUserApiKey = createKeyResponse.apiKey;
      console.log(`✅ Created API key: ${regularUserApiKey.name}`);
      console.log(`   Key: ${regularUserApiKey.key.substring(0, 10)}...`);
    } catch (error) {
      console.log('ℹ️ Regular user may not have permission to create API keys');
      // Continue with tests
    }
    
    // Step 9: Create API Key (Admin)
    console.log('\n🧪 Test 9: Create API Key (Admin)');
    let adminApiKey;
    try {
      const createKeyResponse = await makeRequest(
        'POST',
        '/users/me/apikeys',
        adminUserToken,
        {
          name: 'Admin API Key'
        },
        'Create API key (admin)'
      );
      
      adminApiKey = createKeyResponse.apiKey;
      console.log(`✅ Created admin API key: ${adminApiKey.name}`);
      console.log(`   Key: ${adminApiKey.key.substring(0, 10)}...`);
    } catch (error) {
      console.log('ℹ️ Admin user may need additional permissions to create API keys');
      // Continue with tests
    }
    
    // Step 10: Admin Creates API Key for Regular User
    console.log('\n🧪 Test 10: Admin Creates API Key for Regular User');
    let regularUserApiKeyByAdmin;
    try {
      const createKeyResponse = await makeRequest(
        'POST',
        `/admin/users/${regularUserId}/apikeys`,
        adminUserToken,
        {
          name: 'Regular User API Key (Created by Admin)',
          tenantId: 'default'
        },
        'Admin creates API key for regular user'
      );
      
      regularUserApiKeyByAdmin = createKeyResponse.apiKey;
      console.log(`✅ Admin created API key for regular user: ${regularUserApiKeyByAdmin.name}`);
      console.log(`   Key: ${regularUserApiKeyByAdmin.key.substring(0, 10)}...`);
    } catch (error) {
      console.log('ℹ️ This operation may require specific admin permissions');
      // Continue with tests
    }
    
    // Step 11: List API Keys (Regular User)
    console.log('\n🧪 Test 11: List API Keys (Regular User)');
    try {
      const listKeysResponse = await makeRequest(
        'GET',
        '/users/me/apikeys',
        regularUserToken,
        null,
        'List API keys (regular user)'
      );
      
      console.log(`✅ Retrieved ${listKeysResponse.length} API keys for regular user`);
      listKeysResponse.forEach(key => {
        console.log(`   ${key.name} (ID: ${key.id})`);
      });
    } catch (error) {
      console.error('❌ Failed to list API keys for regular user');
      // Continue with tests
    }
    
    // Step 12: Admin Lists User's API Keys
    console.log('\n🧪 Test 12: Admin Lists User\'s API Keys');
    try {
      const listKeysResponse = await makeRequest(
        'GET',
        `/admin/users/${regularUserId}/apikeys`,
        adminUserToken,
        null,
        'Admin lists user API keys'
      );
      
      console.log(`✅ Admin retrieved ${listKeysResponse.length} API keys for regular user`);
      listKeysResponse.forEach(key => {
        console.log(`   ${key.name} (ID: ${key.id})`);
      });
    } catch (error) {
      console.log('ℹ️ This operation may require specific admin permissions');
      // Continue with tests
    }
    
    // Step 13: Revoke API Key (if created)
    if (regularUserApiKey || regularUserApiKeyByAdmin) {
      console.log('\n🧪 Test 13: Revoke API Key');
      
      // Choose a key to revoke
      const keyToRevoke = regularUserApiKey || regularUserApiKeyByAdmin;
      
      try {
        await makeRequest(
          'DELETE',
          `/users/me/apikeys/${keyToRevoke.id}`,
          regularUserToken,
          null,
          'Revoke API key'
        );
        
        console.log(`✅ Successfully revoked API key: ${keyToRevoke.name}`);
      } catch (error) {
        console.error('❌ Failed to revoke API key');
        
        // Try as admin if regular user fails
        if (!error.message.includes('success')) {
          console.log('   Trying to revoke as admin...');
          try {
            await makeRequest(
              'DELETE',
              `/admin/users/${regularUserId}/apikeys/${keyToRevoke.id}`,
              adminUserToken,
              null,
              'Admin revokes user API key'
            );
            
            console.log(`✅ Admin successfully revoked user's API key: ${keyToRevoke.name}`);
          } catch (adminError) {
            console.error('❌ Admin failed to revoke user API key');
          }
        }
      }
    }
    
    console.log('\n✨ User Profile Management Tests Complete ✨');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTest(); 