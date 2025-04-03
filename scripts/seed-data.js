/**
 * Seed script to populate the database with initial data for testing
 * Run with: node scripts/seed-data.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

// Database connection settings (from environment or defaults)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'feature_flags',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Data
const tenants = [
  {
    name: 'Default Organization',
    description: 'Default organization for the system',
  },
  {
    name: 'Development Team',
    description: 'Development team workspace',
  },
  {
    name: 'Marketing Department',
    description: 'Marketing department workspace',
  },
];

const users = [
  {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
  {
    email: 'dev@example.com',
    password: 'password123',
    firstName: 'Developer',
    lastName: 'User',
    role: 'developer',
  },
  {
    email: 'viewer@example.com',
    password: 'password123',
    firstName: 'Viewer',
    lastName: 'User',
    role: 'viewer',
  },
];

const featureFlags = [
  {
    key: 'new-dashboard',
    name: 'New Dashboard UI',
    description: 'Enables the new dashboard UI with enhanced analytics',
    enabled: true,
    targetingRules: [
      {
        name: 'Beta Users',
        description: 'Enable for beta users',
        percentage: 100,
        enabled: true,
        conditions: [
          {
            attribute: 'userRole',
            operator: 'EQUALS',
            value: 'beta',
          },
        ],
      },
    ],
  },
  {
    key: 'dark-mode',
    name: 'Dark Mode',
    description: 'Enables dark mode across the application',
    enabled: true,
    targetingRules: [],
  },
  {
    key: 'premium-features',
    name: 'Premium Features',
    description: 'Enables premium features for paying customers',
    enabled: false,
    targetingRules: [
      {
        name: 'Premium Subscribers',
        description: 'Enable for premium subscribers',
        percentage: 100,
        enabled: true,
        conditions: [
          {
            attribute: 'subscription',
            operator: 'EQUALS',
            value: 'premium',
          },
        ],
      },
    ],
  },
  {
    key: 'experimental-api',
    name: 'Experimental API',
    description: 'Enables experimental API endpoints',
    enabled: false,
    targetingRules: [],
  },
];

// Helper to log with color
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
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
    throw error;
  }
}

// Create API client
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login function - try multiple endpoints
async function login(email, password) {
  const possibleLoginEndpoints = [
    '/auth/login',
    '/login',
  ];

  log.info(`Trying to login as ${email}...`);

  for (const endpoint of possibleLoginEndpoints) {
    try {
      log.info(`Trying login endpoint: ${endpoint}`);
      const response = await api.post(endpoint, { email, password });
      log.success(`Login successful with endpoint: ${endpoint}`);
      return response.data.token || response.data.accessToken;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        // If we get a non-404 error, this might be the right endpoint but with other issues
        log.error(`Login failed at endpoint ${endpoint}: ${error.message}`);
        if (error.response) {
          log.error(`Response: ${JSON.stringify(error.response.data)}`);
        }
      }
      // Continue trying other endpoints if we get a 404
    }
  }

  log.error('All login attempts failed');
  return null;
}

// Try to seed directly into database if API fails
async function seedDirectly() {
  log.info('Attempting to seed data directly into the database...');
  
  try {
    const pool = await connectToDb();
    
    // Get admin user id to use as creator/updater
    let adminId = 'system';
    try {
      const adminUser = await pool.query('SELECT id FROM "user" WHERE email = $1', [ADMIN_EMAIL]);
      if (adminUser.rows.length > 0) {
        adminId = adminUser.rows[0].id;
      }
    } catch (error) {
      log.warn(`Could not find admin user, using 'system' as default creator ID: ${error.message}`);
    }
    
    // Seed tenants
    log.info('Seeding tenants directly...');
    for (const tenant of tenants) {
      try {
        // Check if tenant with this name already exists
        const existingTenant = await pool.query(
          'SELECT * FROM tenant WHERE name = $1',
          [tenant.name]
        );
        
        if (existingTenant.rows.length > 0) {
          log.info(`Tenant '${tenant.name}' already exists, updating description...`);
          await pool.query(
            'UPDATE tenant SET description = $1, updated_by = $2 WHERE name = $3',
            [tenant.description, adminId, tenant.name]
          );
        } else {
          await pool.query(
            'INSERT INTO tenant (name, description, created_by, updated_by) VALUES ($1, $2, $3, $4)',
            [tenant.name, tenant.description, adminId, adminId]
          );
          log.success(`Created tenant: ${tenant.name}`);
        }
      } catch (error) {
        log.error(`Failed to create tenant ${tenant.name}: ${error.message}`);
      }
    }
    
    // Get tenants for foreign keys
    const tenantsResult = await pool.query('SELECT * FROM tenant');
    const dbTenants = tenantsResult.rows;
    
    if (dbTenants.length === 0) {
      log.error('No tenants found in the database. Cannot seed feature flags.');
      await pool.end();
      return false;
    }
    
    // Seed feature flags
    log.info('Seeding feature flags directly...');
    for (const tenant of dbTenants) {
      for (const flag of featureFlags) {
        try {
          // Check if flag already exists
          const existingFlag = await pool.query(
            'SELECT * FROM feature_flag WHERE key = $1 AND tenant_id = $2',
            [flag.key, tenant.id]
          );
          
          let flagId;
          if (existingFlag.rows.length > 0) {
            log.info(`Flag '${flag.key}' already exists for tenant '${tenant.name}', updating...`);
            await pool.query(
              'UPDATE feature_flag SET name = $1, description = $2, enabled = $3 WHERE key = $4 AND tenant_id = $5',
              [flag.name, flag.description, flag.enabled, flag.key, tenant.id]
            );
            flagId = existingFlag.rows[0].id;
          } else {
            const result = await pool.query(
              'INSERT INTO feature_flag (key, name, description, enabled, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
              [flag.key, flag.name, flag.description, flag.enabled, tenant.id]
            );
            flagId = result.rows[0].id;
            log.success(`Created feature flag: ${flag.name} for tenant ${tenant.name}`);
          }
          
          // Add targeting rules if any
          if (flag.targetingRules && flag.targetingRules.length > 0) {
            for (const rule of flag.targetingRules) {
              const ruleResult = await pool.query(
                'INSERT INTO targeting_rule (name, description, percentage, enabled, flag_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [rule.name, rule.description, rule.percentage, rule.enabled, flagId]
              );
              
              const ruleId = ruleResult.rows[0].id;
              
              // Add conditions
              for (const condition of rule.conditions) {
                await pool.query(
                  'INSERT INTO condition (attribute, operator, value, rule_id) VALUES ($1, $2, $3, $4)',
                  [condition.attribute, condition.operator, condition.value, ruleId]
                );
              }
              
              log.success(`Added targeting rule to ${flag.name}: ${rule.name}`);
            }
          }
        } catch (error) {
          log.error(`Failed to create feature flag ${flag.name}: ${error.message}`);
        }
      }
    }
    
    await pool.end();
    return true;
  } catch (error) {
    log.error(`Direct seeding failed: ${error.message}`);
    return false;
  }
}

// Seed tenants
async function seedTenants(token) {
  log.info('Seeding tenants...');
  
  // Set auth token
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  const createdTenants = [];
  
  for (const tenant of tenants) {
    try {
      const response = await api.post('/tenants', tenant);
      createdTenants.push(response.data);
      log.success(`Created tenant: ${tenant.name}`);
    } catch (error) {
      log.error(`Failed to create tenant ${tenant.name}: ${error.message}`);
      if (error.response) {
        log.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  return createdTenants;
}

// Seed users
async function seedUsers(token) {
  log.info('Seeding users...');
  
  // Set auth token
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  const createdUsers = [];
  
  const possibleUserEndpoints = [
    '/auth/users',
    '/users',
    '/auth/register',
    '/v1/users',
  ];
  
  // Skip admin user as it should already exist
  const usersToSeed = users.filter(user => user.email !== ADMIN_EMAIL);
  
  for (const user of usersToSeed) {
    let userCreated = false;
    
    for (const endpoint of possibleUserEndpoints) {
      if (userCreated) break;
      
      try {
        log.info(`Trying to create user ${user.firstName} ${user.lastName} at endpoint: ${endpoint}`);
        const response = await api.post(endpoint, user);
        createdUsers.push(response.data);
        log.success(`Created user: ${user.firstName} ${user.lastName}`);
        userCreated = true;
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          log.error(`Failed to create user ${user.firstName} ${user.lastName} at ${endpoint}: ${error.message}`);
          if (error.response) {
            log.error(`Response: ${JSON.stringify(error.response.data)}`);
          }
        }
      }
    }
    
    if (!userCreated) {
      log.warn(`Could not create user ${user.firstName} ${user.lastName} via any API endpoint.`);
    }
  }
  
  return createdUsers;
}

// Seed feature flags
async function seedFeatureFlags(token, tenantId) {
  log.info(`Seeding feature flags for tenant ${tenantId}...`);
  
  // Set auth token and tenant header
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  api.defaults.headers.common['x-tenant-id'] = tenantId;
  
  const createdFlags = [];
  
  for (const flag of featureFlags) {
    try {
      // Add tenant ID to the flag
      const flagWithTenant = {
        ...flag,
        tenantId,
      };
      
      // Create the flag
      const response = await api.post('/feature-flags', flagWithTenant);
      const createdFlag = response.data;
      log.success(`Created feature flag: ${flag.name}`);
      
      // Add targeting rules if any
      if (flag.targetingRules && flag.targetingRules.length > 0) {
        for (const rule of flag.targetingRules) {
          try {
            await api.post(`/feature-flags/${createdFlag.key}/targeting-rules`, rule);
            log.success(`Added targeting rule to ${flag.name}: ${rule.name}`);
          } catch (ruleError) {
            log.error(`Failed to add targeting rule to ${flag.name}: ${ruleError.message}`);
            if (ruleError.response) {
              log.error(`Response: ${JSON.stringify(ruleError.response.data)}`);
            }
          }
        }
      }
      
      createdFlags.push(createdFlag);
    } catch (error) {
      log.error(`Failed to create feature flag ${flag.name}: ${error.message}`);
      if (error.response) {
        log.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  return createdFlags;
}

// Main function
async function main() {
  log.info('Starting seed process...');
  
  try {
    // Try API-based seeding first
    try {
      // Login with admin credentials
      log.info(`Logging in as ${ADMIN_EMAIL}...`);
      const token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      
      if (!token) {
        log.error('Failed to login. Attempting direct database seeding as a fallback.');
        if (await seedDirectly()) {
          log.success('Direct database seeding completed successfully!');
          return;
        } else {
          throw new Error('All seeding methods failed');
        }
      }
      
      // Seed tenants
      const createdTenants = await seedTenants(token);
      
      if (createdTenants.length === 0) {
        log.warn('No tenants were created. Using default tenant...');
        // Try to get existing tenants
        try {
          const response = await api.get('/tenants');
          if (response.data.length > 0) {
            createdTenants.push(...response.data);
          }
        } catch (error) {
          log.error(`Failed to get existing tenants: ${error.message}`);
          // No tenants via API, try direct seeding
          throw new Error('No tenants available via API');
        }
      }
      
      // Seed users
      await seedUsers(token);
      
      // Seed feature flags for each tenant
      for (const tenant of createdTenants) {
        await seedFeatureFlags(token, tenant.id);
      }
    } catch (apiError) {
      log.error(`API-based seeding failed: ${apiError.message}`);
      log.info('Falling back to direct database seeding...');
      
      if (await seedDirectly()) {
        log.success('Direct database seeding completed successfully!');
        return;
      } else {
        throw new Error('All seeding methods failed');
      }
    }
    
    log.success('Seed process completed successfully!');
  } catch (error) {
    log.error(`Seed process failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 