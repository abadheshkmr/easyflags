import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRowLevelSecurity1713553936000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostgreSQL row level security
    
    // Create tenant context function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_tenant_context() RETURNS VOID AS $$
      BEGIN
        -- Create current_tenant_id setting if it doesn't exist
        IF current_setting('app.current_tenant_id', TRUE) IS NULL THEN
          PERFORM set_config('app.current_tenant_id', '', FALSE);
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Run on connection start
    await queryRunner.query(`
      SELECT set_tenant_context();
    `);

    // Enable RLS on feature_flag table
    await queryRunner.query(`
      ALTER TABLE feature_flag ENABLE ROW LEVEL SECURITY;
    `);

    // Create policy for feature_flag tenant isolation
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_policy ON feature_flag;
      CREATE POLICY tenant_isolation_policy ON feature_flag
        USING (
          (current_setting('app.current_tenant_id', TRUE) = '' OR tenant_id::text = current_setting('app.current_tenant_id', TRUE))
        );
    `);

    // Enable RLS on targeting_rule table with FK check
    await queryRunner.query(`
      ALTER TABLE targeting_rule ENABLE ROW LEVEL SECURITY;
    `);

    // Create policy for targeting_rule isolation via flag_id FK
    await queryRunner.query(`
      DROP POLICY IF EXISTS rule_isolation_policy ON targeting_rule;
      CREATE POLICY rule_isolation_policy ON targeting_rule
        USING (
          "featureFlagId" IN (
            SELECT id FROM feature_flag 
            WHERE current_setting('app.current_tenant_id', TRUE) = '' 
              OR tenant_id::text = current_setting('app.current_tenant_id', TRUE)
          )
        );
    `);

    // Same for condition table
    await queryRunner.query(`
      ALTER TABLE condition ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      DROP POLICY IF EXISTS condition_isolation_policy ON condition;
      CREATE POLICY condition_isolation_policy ON condition
        USING (
          "targetingRuleId" IN (
            SELECT id FROM targeting_rule WHERE "featureFlagId" IN (
              SELECT id FROM feature_flag 
              WHERE current_setting('app.current_tenant_id', TRUE) = '' 
                OR tenant_id::text = current_setting('app.current_tenant_id', TRUE)
            )
          )
        );
    `);

    // Create superuser bypass policy - system admins can see all records
    await queryRunner.query(`
      DROP POLICY IF EXISTS admin_policy ON feature_flag;
      CREATE POLICY admin_policy ON feature_flag
        USING (current_setting('app.is_admin', TRUE) = 'true')
        WITH CHECK (current_setting('app.is_admin', TRUE) = 'true');
      
      DROP POLICY IF EXISTS admin_policy ON targeting_rule;
      CREATE POLICY admin_policy ON targeting_rule
        USING (current_setting('app.is_admin', TRUE) = 'true')
        WITH CHECK (current_setting('app.is_admin', TRUE) = 'true');
        
      DROP POLICY IF EXISTS admin_policy ON condition;
      CREATE POLICY admin_policy ON condition
        USING (current_setting('app.is_admin', TRUE) = 'true')
        WITH CHECK (current_setting('app.is_admin', TRUE) = 'true');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Disable RLS
    await queryRunner.query(`
      ALTER TABLE feature_flag DISABLE ROW LEVEL SECURITY;
      ALTER TABLE targeting_rule DISABLE ROW LEVEL SECURITY;
      ALTER TABLE condition DISABLE ROW LEVEL SECURITY;
    `);

    // Drop policies
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_policy ON feature_flag;
      DROP POLICY IF EXISTS rule_isolation_policy ON targeting_rule;
      DROP POLICY IF EXISTS condition_isolation_policy ON condition;
      DROP POLICY IF EXISTS admin_policy ON feature_flag;
      DROP POLICY IF EXISTS admin_policy ON targeting_rule;
      DROP POLICY IF EXISTS admin_policy ON condition;
    `);

    // Drop function
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS set_tenant_context();
    `);
  }
} 