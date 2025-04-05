/**
 * Script to create a test tenant with API key for testing
 */

const { Pool } = require('pg');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'feature_flags',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Test data
const TEST_TENANT = {
  name: 'test-tenant',
  displayName: 'Test Tenant',
  description: 'Test tenant for API testing',
  apiKey: 'test-api-key-123456',
};

async function createTestTenant() {
  console.log('Connecting to database...');
  const pool = new Pool(DB_CONFIG);

  try {
    // Check connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Check if api_key column exists, if not add it
    const columnsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tenant' AND column_name = 'api_key'
    `);
    
    if (columnsResult.rows.length === 0) {
      console.log('Adding api_key column to tenant table...');
      await pool.query(`ALTER TABLE tenant ADD COLUMN api_key VARCHAR(255)`);
    }

    console.log('Creating test tenant...');

    // Create test tenant if it doesn't exist
    const tenantResult = await pool.query(
      `SELECT id, api_key FROM tenant WHERE name = $1`,
      [TEST_TENANT.name]
    );

    let tenantId;
    let apiKey = TEST_TENANT.apiKey;

    if (tenantResult.rows.length > 0) {
      tenantId = tenantResult.rows[0].id;
      // Update API key if it's null
      if (!tenantResult.rows[0].api_key) {
        await pool.query(
          `UPDATE tenant SET api_key = $1 WHERE id = $2`,
          [apiKey, tenantId]
        );
        console.log(`Updated API key for existing tenant: ID=${tenantId}`);
      } else {
        apiKey = tenantResult.rows[0].api_key;
      }
      console.log(`Test tenant already exists: ID=${tenantId}, API Key=${apiKey}`);
    } else {
      // Insert new tenant
      const insertResult = await pool.query(
        `INSERT INTO tenant
         (name, description, api_key, "createdAt", "updatedAt", "createdBy", "updatedBy")
         VALUES ($1, $2, $3, NOW(), NOW(), 'system', 'system')
         RETURNING id`,
        [TEST_TENANT.name, TEST_TENANT.description, apiKey]
      );

      tenantId = insertResult.rows[0].id;
      console.log(`Created test tenant: ID=${tenantId}, API Key=${apiKey}`);
    }

    // Check if feature_flags table exists
    const flagsTableCheck = await pool.query(`
      SELECT to_regclass('public.feature_flags') as exists
    `);

    if (flagsTableCheck.rows[0].exists) {
      // Create test feature flag
      console.log('Creating test feature flag...');
      
      // Get the column names for feature_flags table
      const flagColumnsResult = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'feature_flags'
      `);
      
      const flagColumns = flagColumnsResult.rows.map(row => row.column_name);
      console.log('Feature flags columns:', flagColumns);
      
      if (flagColumns.includes('tenantId')) {
        // Check if flag already exists
        const flagResult = await pool.query(
          `SELECT id FROM feature_flags WHERE key = $1 AND "tenantId" = $2`,
          ['test-flag', tenantId]
        );
        
        if (flagResult.rows.length === 0) {
          // Insert only if it doesn't exist
          await pool.query(
            `INSERT INTO feature_flags
             (key, name, description, "tenantId", enabled, "createdAt", "updatedAt", "createdBy", "updatedBy")
             VALUES ($1, $2, $3, $4, true, NOW(), NOW(), 'system', 'system')`,
            ['test-flag', 'Test Flag', 'Flag for testing', tenantId]
          );
          console.log('Test flag created successfully');
        } else {
          console.log('Test flag already exists');
        }
      } else {
        console.log('Feature flag table structure is different than expected, skipping flag creation');
      }
    } else {
      console.log('Feature flags table not found, skipping flag creation');
    }

    return { tenantId, apiKey };
  } catch (error) {
    console.error(`Error creating test data: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
createTestTenant()
  .then(({ tenantId, apiKey }) => {
    console.log('\n📋 Test Configuration');
    console.log('------------------');
    console.log(`TENANT_ID=${tenantId}`);
    console.log(`API_KEY=${apiKey}`);
    console.log('FLAG_KEY=test-flag');
    
    // Save to .env.test file
    const fs = require('fs');
    const path = require('path');
    const envContent = 
`# Test Configuration
TENANT_ID=${tenantId}
API_KEY=${apiKey}
FLAG_KEY=test-flag
`;
    fs.writeFileSync(path.join(__dirname, '..', '.env.test'), envContent);
    console.log('\nConfiguration saved to .env.test');
  })
  .catch(err => {
    console.error('Failed to create test tenant:', err);
    process.exit(1);
  }); 