import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetricsTable1713554936000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create metrics table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS flag_evaluation_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        flag_key VARCHAR(255) NOT NULL,
        evaluation_count INTEGER NOT NULL DEFAULT 0,
        success_count INTEGER NOT NULL DEFAULT 0,
        error_count INTEGER NOT NULL DEFAULT 0,
        latency_sum INTEGER NOT NULL DEFAULT 0,
        period_start TIMESTAMP WITH TIME ZONE NOT NULL,
        period_end TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, flag_key, period_start)
      )
    `);

    // Add indexes for faster queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_metrics_tenant ON flag_evaluation_metrics(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_flag_key ON flag_evaluation_metrics(flag_key);
      CREATE INDEX IF NOT EXISTS idx_metrics_period ON flag_evaluation_metrics(period_start, period_end);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_metrics_tenant;
      DROP INDEX IF EXISTS idx_metrics_flag_key;
      DROP INDEX IF EXISTS idx_metrics_period;
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS flag_evaluation_metrics;
    `);
  }
} 