/**
 * Database schema creation script
 * Creates the necessary tables for the feature flag service
 * Run with: node scripts/create-schema.js
 */

const { Pool } = require('pg');

// Configuration (from environment or defaults)
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

async function createSchema() {
  log.info('Connecting to database...');
  const pool = new Pool(DB_CONFIG);

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    log.success('Database connection successful');

    // Begin transaction
    await pool.query('BEGIN');

    log.info('Creating schema...');

    // Create user table
    log.info('Creating user table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inspect existing tenant table structure
    log.info('Checking tenant table structure...');
    let tenantTableExists = false;
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tenant'
        )
      `);
      tenantTableExists = tableCheck.rows[0].exists;
    } catch (error) {
      log.error(`Error checking tenant table: ${error.message}`);
    }

    // Create or update tenant table
    log.info('Creating tenant table...');
    if (!tenantTableExists) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255) NOT NULL,
          updated_by VARCHAR(255) NOT NULL
        )
      `);
    } else {
      // Check and add created_by/updated_by columns if they don't exist
      const columnsResult = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'tenant' AND column_name IN ('created_by', 'updated_by')
      `);
      
      const columns = columnsResult.rows.map(row => row.column_name);
      
      if (!columns.includes('created_by')) {
        log.info('Adding missing created_by column to tenant table...');
        await pool.query(`ALTER TABLE tenant ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT 'system'`);
      }
      
      if (!columns.includes('updated_by')) {
        log.info('Adding missing updated_by column to tenant table...');
        await pool.query(`ALTER TABLE tenant ADD COLUMN updated_by VARCHAR(255) NOT NULL DEFAULT 'system'`);
      }
      
      // Check and remove key column if it exists (for backward compatibility)
      const keyColumnExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'tenant' AND column_name = 'key'
        )
      `);
      
      if (keyColumnExists.rows[0].exists) {
        log.info('Removing deprecated key column from tenant table...');
        await pool.query(`ALTER TABLE tenant DROP COLUMN IF EXISTS key`);
      }
    }

    // Create feature_flag table
    log.info('Creating feature_flag table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_flag (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT false,
        tenant_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        UNIQUE(key, tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE
      )
    `);

    // Create targeting_rule table
    log.info('Creating targeting_rule table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS targeting_rule (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        percentage INTEGER NOT NULL DEFAULT 100,
        enabled BOOLEAN DEFAULT true,
        variant VARCHAR(255),
        flag_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flag_id) REFERENCES feature_flag(id) ON DELETE CASCADE
      )
    `);

    // Create condition table
    log.info('Creating condition table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS condition (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attribute VARCHAR(255) NOT NULL,
        operator VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        rule_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rule_id) REFERENCES targeting_rule(id) ON DELETE CASCADE
      )
    `);

    // Create flag_version table for versioning
    log.info('Creating flag_version table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flag_version (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flag_id UUID NOT NULL,
        version INTEGER NOT NULL,
        data JSONB NOT NULL,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flag_id) REFERENCES feature_flag(id) ON DELETE CASCADE
      )
    `);

    // Commit transaction
    await pool.query('COMMIT');
    log.success('Schema created successfully!');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error(`Error creating schema: ${error.message}`);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the main function
createSchema().catch(err => {
  log.error(`Schema creation failed: ${err.message}`);
  process.exit(1);
}); 