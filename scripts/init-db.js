/**
 * Database initialization script
 * Creates the admin user if it doesn't exist
 * Run with: node scripts/init-db.js
 */

const axios = require('axios');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Admin';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'User';

// Database connection settings (from environment or defaults)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'feature_flags',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Helper to log with color
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`),
};

// Connect to database
async function connectToDb() {
  log.info(`Connecting to database ${DB_CONFIG.database}...`);
  try {
    const pool = new Pool(DB_CONFIG);
    // Test connection
    await pool.query('SELECT NOW()');
    log.success('Database connection successful');
    return pool;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

// Create admin user directly in the database
async function createAdminUser(pool) {
  log.info(`Creating admin user (${ADMIN_EMAIL})...`);
  
  try {
    // Check if admin user already exists
    const userCheck = await pool.query(
      'SELECT * FROM "user" WHERE email = $1',
      [ADMIN_EMAIL]
    );
    
    if (userCheck.rows.length > 0) {
      log.info('Admin user already exists');
      return userCheck.rows[0];
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
    
    // Insert the admin user
    const result = await pool.query(
      'INSERT INTO "user" (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ADMIN_EMAIL, hashedPassword, ADMIN_FIRST_NAME, ADMIN_LAST_NAME, 'admin']
    );
    
    log.success('Admin user created successfully');
    return result.rows[0];
  } catch (error) {
    log.error(`Failed to create admin user: ${error.message}`);
    // Continue execution as we might want to try the API method
    return null;
  }
}

// Try creating admin user via API - try multiple potential endpoints
async function createAdminViaApi() {
  const possibleEndpoints = [
    '/auth/register',
    '/auth/signup',
    '/users',
    '/auth/users'
  ];
  
  log.info('Trying to create admin user via API...');
  
  for (const endpoint of possibleEndpoints) {
    try {
      log.info(`Trying endpoint: ${endpoint}`);
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: 'admin',
      });
      
      log.success(`Admin user created via API (${endpoint})`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        // If we get a non-404 error, this might be the right endpoint but with other issues
        log.error(`Failed at endpoint ${endpoint}: ${error.message}`);
        if (error.response) {
          log.error(`Response: ${JSON.stringify(error.response.data)}`);
        }
      }
      // Continue trying other endpoints if we get a 404
    }
  }
  
  log.error('All API user creation attempts failed');
  return null;
}

// Create initial tenant if needed
async function createInitialTenant(pool) {
  log.info('Checking for initial tenant...');
  
  try {
    // Check if any tenant exists
    const tenantCheck = await pool.query('SELECT * FROM tenant LIMIT 1');
    
    if (tenantCheck.rows.length > 0) {
      log.info('Initial tenant already exists');
      return tenantCheck.rows[0];
    }
    
    // Get admin user id to use as creator/updater
    const adminUser = await pool.query('SELECT id FROM "user" WHERE email = $1', [ADMIN_EMAIL]);
    const adminId = adminUser.rows.length > 0 ? adminUser.rows[0].id : 'system';
    
    // Create a default tenant
    const result = await pool.query(
      'INSERT INTO tenant (name, description, created_by, updated_by) VALUES ($1, $2, $3, $4) RETURNING *',
      ['Default Organization', 'Default organization for the system', adminId, adminId]
    );
    
    log.success('Initial tenant created');
    return result.rows[0];
  } catch (error) {
    log.error(`Failed to create initial tenant: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  log.info('Starting database initialization...');
  
  try {
    // Connect to database
    const pool = await connectToDb();
    
    // Try creating the admin user in the database
    let adminUser = await createAdminUser(pool);
    
    // If direct DB creation failed, try API method
    if (!adminUser) {
      adminUser = await createAdminViaApi();
    }
    
    if (!adminUser) {
      log.error('Failed to create admin user by any method. Database initialization incomplete.');
      process.exit(1);
    }
    
    // Ensure at least one tenant exists
    await createInitialTenant(pool);
    
    // Close pool
    await pool.end();
    
    log.success('Database initialization completed successfully!');
  } catch (error) {
    log.error(`Database initialization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 