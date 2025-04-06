// Test script for permissions with enhanced logging
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = 'http://localhost:3000/api';

// Try to load the JWT secret from environment variables or .env file
let JWT_SECRET = 'your-secret-key'; // Default fallback
try {
  // Check if .env file exists and read JWT_SECRET
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

console.log(`🔑 Using JWT_SECRET: ${JWT_SECRET.substring(0, 3)}...${JWT_SECRET.substring(JWT_SECRET.length - 3)}`);

// Create a test JWT for a test user with specific permissions
const createTestToken = (userId, permissions = [], roles = []) => {
  console.log(`📝 Creating token for user ${userId} with permissions: ${permissions.join(', ')}`);
  
  // Convert permission strings to match expected format
  // The guard expects permissions like "view:tenants" instead of "VIEW_TENANTS"
  const formattedPermissions = permissions.map(perm => {
    // If permission is already in the correct format (contains a colon), return as is
    if (perm.includes(':')) return perm;
    
    // Convert from "VIEW_TENANTS" format to "view:tenants" format
    return perm.toLowerCase().replace('_', ':');
  });
  
  console.log(`🔀 Formatted permissions: ${formattedPermissions.join(', ')}`);
  
  // Build token payload with both permissions and roles
  const payload = {
    sub: userId,
    email: 'test@example.com',
    // Include both formats to be sure
    directPermissions: formattedPermissions,
    permissions: formattedPermissions,
    roles: roles.map(role => ({ 
      name: role,
      permissions: role === 'admin' ? ['super:admin'] : []
    })),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  };
  
  const token = jwt.sign(payload, JWT_SECRET);
  
  // Debug token verification
  try {
    jwt.verify(token, JWT_SECRET);
    console.log('🔒 Token verification successful');
    console.log('📄 Token payload:', JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
  }
  
  return token;
};

// Function to create a test user
const createTestUser = async () => {
  console.log('👤 Creating test user...');
  
  // Generate a unique email to avoid conflicts
  const uniqueEmail = `test.${uuidv4().substring(0, 8)}@example.com`;
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: uniqueEmail,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log(`✅ Test user created with email: ${uniqueEmail}`);
    
    // Extract user ID from response
    const userId = response.data.user.id;
    console.log(`🆔 User ID: ${userId}`);
    
    // Also save the token from registration
    const registrationToken = response.data.accessToken;
    
    return { userId, email: uniqueEmail, registrationToken };
  } catch (error) {
    console.error('❌ Failed to create test user:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📄 Error details:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error('User creation failed');
  }
};

// Test API endpoints with different permission sets
const testPermissions = async () => {
  console.log('🧪 Starting permission tests...');

  try {
    // Create a user first
    const { userId, email, registrationToken } = await createTestUser();
    
    if (!registrationToken) {
      throw new Error('Registration token not available');
    }
    
    // Decode token to inspect payload
    const decoded = jwt.decode(registrationToken);
    console.log('📄 Registration token payload:', JSON.stringify(decoded, null, 2));

    // Test endpoints with the registration token
    console.log('\n1️⃣ Testing with actual registration token:');
    
    // First, test if the token works for protected endpoints (user self info)
    try {
      console.log(`📤 Accessing user info at: ${API_URL}/users/me`);
      const profileResponse = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${registrationToken}` }
      });
      console.log(`✅ User info access successful (${profileResponse.status})`);
      console.log(`📄 User profile: ${JSON.stringify(profileResponse.data)}`);
    } catch (error) {
      console.log(`❌ User info access failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      console.log(`📄 Full error response: ${JSON.stringify(error.response?.data || {})}`);
    }
    
    // Test access to tenants (should be denied for new user)
    try {
      console.log(`📤 Accessing tenants endpoint: ${API_URL}/tenants`);
      await axios.get(`${API_URL}/tenants`, {
        headers: { Authorization: `Bearer ${registrationToken}` }
      });
      console.log('❌ Tenant access granted (unexpected)');
    } catch (error) {
      console.log(`✅ Tenant access denied as expected: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      console.log(`📄 Full error response: ${JSON.stringify(error.response?.data || {})}`);
    }
    
    // If we implement an endpoint to assign permissions, we could test that here
    // For now, we'll just note what would be the next steps
    console.log('\n🔑 To fully test permissions:');
    console.log('1. Create an admin endpoint to assign permissions to users');
    console.log('2. Call this endpoint to add tenant view permissions to our test user');
    console.log('3. Test tenant access again with the same token (should be granted)');
    console.log('4. Repeat for other permission combinations');

    console.log('\n✅ Permission tests completed.');
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
};

// Helper to print token info for debugging
const debugToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    console.log('Token payload:', JSON.stringify(decoded, null, 2));
  } catch (e) {
    console.log('Error decoding token:', e.message);
  }
};

// Run the tests
testPermissions(); 