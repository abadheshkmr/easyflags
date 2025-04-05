import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantNameConstraint1743877551000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique constraint on tenant name
    await queryRunner.query(`
      ALTER TABLE tenant
      ADD CONSTRAINT uk_tenant_name UNIQUE (name);
    `);
    
    // Add index for faster lookups by name
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_name ON tenant(name);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tenant_name;
    `);
    
    // Drop unique constraint
    await queryRunner.query(`
      ALTER TABLE tenant
      DROP CONSTRAINT IF EXISTS uk_tenant_name;
    `);
  }
} 