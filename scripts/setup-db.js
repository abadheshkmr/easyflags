#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script creates and initializes the database for testing purposes.
 * It:
 * 1. Creates the database if it doesn't exist
 * 2. Creates basic tables needed for tests
 * 3. Seeds some initial test data
 */

const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Database connection parameters
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'feature_flags';

console.log('🛠️  Database Setup Utility');
console.log('=========================');
console.log(`Database: ${DB_NAME}`);
console.log(`Host: ${DB_HOST}:${DB_PORT}`);
console.log(`User: ${DB_USERNAME}`);

/**
 * Check and create database if needed
 */
async function createDatabase() {
  // Connect to postgres (default database)
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: 'postgres'
  });
  
  try {
    await client.connect();
    console.log('\n✅ Connected to PostgreSQL');
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    
    if (result.rowCount === 0) {
      console.log(`Creating database '${DB_NAME}'...`);
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database '${DB_NAME}' created successfully`);
    } else {
      console.log(`✅ Database '${DB_NAME}' already exists`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating database: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Create test user for authentication tests
 */
async function createTestData() {
  // Connect to the feature flags database
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME
  });
  
  try {
    await client.connect();
    console.log('\n✅ Connected to feature_flags database');
    
    // Create test tenant if it doesn't exist
    console.log('\nCreating test tenant...');
    
    // Check if tenant table exists
    const tableResult = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant'
    `);
    
    if (tableResult.rowCount === 0) {
      console.log('❌ Tenant table does not exist yet. Run database migrations first.');
      return;
    }
    
    // Check if test tenant exists
    const tenantResult = await client.query(`
      SELECT * FROM tenant WHERE name = 'test-tenant'
    `);
    
    let testTenantId;
    let apiKey = 'test-api-key-123456';
    
    if (tenantResult.rowCount === 0) {
      // Create test tenant
      const insertResult = await client.query(`
        INSERT INTO tenant (name, display_name, description, api_key, createdAt, updatedAt, createdBy, updatedBy)
        VALUES ('test-tenant', 'Test Tenant', 'Created for testing', $1, NOW(), NOW(), 'system', 'system')
        RETURNING id
      `, [apiKey]);
      
      testTenantId = insertResult.rows[0].id;
      console.log(`✅ Created test tenant with ID: ${testTenantId}`);
    } else {
      testTenantId = tenantResult.rows[0].id;
      apiKey = tenantResult.rows[0].api_key;
      console.log(`✅ Test tenant already exists with ID: ${testTenantId}`);
    }
    
    // Create test flag if it doesn't exist
    console.log('\nCreating test flag...');
    
    // Check if feature_flag table exists
    const flagTableResult = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'feature_flag'
    `);
    
    if (flagTableResult.rowCount === 0) {
      console.log('❌ feature_flag table does not exist yet. Run database migrations first.');
      return;
    }
    
    // Check if test flag exists
    const flagResult = await client.query(`
      SELECT * FROM feature_flag WHERE key = 'test-flag' AND tenant_id = $1
    `, [testTenantId]);
    
    if (flagResult.rowCount === 0) {
      // Create test flag
      await client.query(`
        INSERT INTO feature_flag (
          key, name, description, tenant_id, enabled, 
          created_at, updated_at
        )
        VALUES (
          'test-flag', 'Test Flag', 'Created for testing', $1, true,
          NOW(), NOW()
        )
      `, [testTenantId]);
      
      console.log('✅ Created test flag: test-flag');
    } else {
      console.log('✅ Test flag already exists');
    }
    
    // Show configuration for tests
    console.log('\n📋 Test Configuration');
    console.log('------------------');
    console.log(`TENANT_ID=${testTenantId}`);
    console.log(`API_KEY=${apiKey}`);
    console.log('FLAG_KEY=test-flag');
    
    return {
      tenantId: testTenantId,
      apiKey
    };
  } catch (error) {
    console.error(`❌ Error creating test data: ${error.message}`);
  } finally {
    await client.end();
  }
}

// Run the setup
async function runSetup() {
  try {
    const dbCreated = await createDatabase();
    if (dbCreated) {
      console.log('\n✅ Database setup successful');
      
      // Create test data if requested
      if (process.argv.includes('--with-test-data')) {
        const testData = await createTestData();
        if (testData) {
          // Save test configuration to a file
          fs.writeFileSync(
            path.resolve(__dirname, '.test-config.json'),
            JSON.stringify(testData, null, 2)
          );
          console.log('\n✅ Test data created successfully');
        }
      }
    }
  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

runSetup(); 