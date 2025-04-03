/**
 * Database creation script
 * Creates the database if it doesn't exist
 * Run with: node scripts/create-database.js
 */

const { Client } = require('pg');

// Configuration (from environment or defaults)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default postgres database first
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const TARGET_DB = process.env.DB_NAME || 'feature_flags';

// Helper to log with color
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`),
};

async function createDatabase() {
  log.info(`Connecting to PostgreSQL server to create database...`);
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    log.success('Connected to PostgreSQL server');
    
    // Check if the database already exists
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [TARGET_DB]
    );
    
    if (checkResult.rows.length > 0) {
      log.info(`Database '${TARGET_DB}' already exists`);
      return true;
    }
    
    // Create the database
    log.info(`Creating database '${TARGET_DB}'...`);
    await client.query(`CREATE DATABASE ${TARGET_DB} ENCODING 'UTF8'`);
    log.success(`Database '${TARGET_DB}' created successfully`);
    
    // Create the extension for UUID generation if needed
    const targetClient = new Client({
      ...DB_CONFIG,
      database: TARGET_DB,
    });
    
    await targetClient.connect();
    log.info(`Creating extensions...`);
    await targetClient.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    log.success(`Extensions created successfully`);
    await targetClient.end();
    
    return true;
  } catch (error) {
    log.error(`Error creating database: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

// Run the function
createDatabase()
  .then((success) => {
    if (success) {
      log.success('Database setup completed successfully');
      process.exit(0);
    } else {
      log.error('Database setup failed');
      process.exit(1);
    }
  })
  .catch((err) => {
    log.error(`Database setup error: ${err.message}`);
    process.exit(1);
  }); 