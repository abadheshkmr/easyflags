import { Client } from 'pg';
import { Logger } from '@nestjs/common';

/**
 * Initializes the database by checking if it exists and creating it if necessary.
 * This function runs before the application bootstrap in development mode.
 */
export async function initializeDatabase(
  host: string,
  port: number,
  username: string,
  password: string,
  database: string
): Promise<void> {
  const logger = new Logger('DatabaseInit');
  
  // Connect to PostgreSQL without specifying a database to check if our database exists
  const client = new Client({
    host,
    port,
    user: username,
    password,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    logger.log('Connected to PostgreSQL to check database status');

    // Check if the database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [database]
    );

    if (result.rowCount === 0) {
      logger.log(`Database '${database}' does not exist. Creating...`);
      
      // Create the database
      // Need to escape identifiers to handle special characters in database names
      await client.query(`CREATE DATABASE "${database}"`);
      logger.log(`Database '${database}' created successfully`);
    } else {
      logger.log(`Database '${database}' already exists`);
    }
  } catch (error) {
    logger.error(`Failed to initialize database: ${error.message}`, error.stack);
    throw error;
  } finally {
    await client.end();
  }
} 