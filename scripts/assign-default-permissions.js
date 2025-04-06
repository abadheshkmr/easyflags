#!/usr/bin/env node

/**
 * Assign Default Permissions Migration
 * 
 * This script assigns default permissions to existing users based on their roles.
 * It's intended to be run once after updating to the new permission system.
 */

const { NestFactory } = require('@nestjs/core');
const { Logger } = require('@nestjs/common');
const { AppModule } = require('../packages/server/src/app.module');
const { UserEntity } = require('../packages/server/src/auth/entities/user.entity');
const { PermissionService } = require('../packages/server/src/auth/services/permission.service');
const { getRepositoryToken } = require('@nestjs/typeorm');

async function bootstrap() {
  // Create a standalone application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('PermissionMigration');
  
  try {
    logger.log('Starting permission migration...');
    
    // Get the required services and repositories
    const permissionService = app.get(PermissionService);
    const userRepository = app.get(getRepositoryToken(UserEntity));
    
    // Get all users
    const users = await userRepository.find({
      relations: ['roles']
    });
    
    logger.log(`Found ${users.length} users to process.`);
    
    // Count variables for reporting
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Skip users that already have roles assigned
        if (user.roles && user.roles.length > 0) {
          logger.debug(`Skipping user ${user.id} (${user.email}) as they already have roles assigned.`);
          skippedCount++;
          continue;
        }
        
        // Determine role from the user's role enum
        const roleName = user.role ? user.role.toLowerCase() : 'user';
        
        // Assign default permissions
        logger.log(`Assigning permissions for user ${user.id} (${user.email}) with role ${roleName}`);
        await permissionService.assignDefaultPermissionsToUser(user.id, roleName);
        
        successCount++;
      } catch (error) {
        logger.error(`Error assigning permissions to user ${user.id} (${user.email}): ${error.message}`);
        errorCount++;
      }
    }
    
    // Print summary
    logger.log('Permission migration completed:');
    logger.log(`  - ${successCount} users successfully updated`);
    logger.log(`  - ${skippedCount} users skipped (already had roles)`);
    logger.log(`  - ${errorCount} users failed`);
    
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the migration
bootstrap()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 