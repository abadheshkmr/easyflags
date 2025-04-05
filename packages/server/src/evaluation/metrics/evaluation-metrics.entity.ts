import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * Entity to store aggregated feature flag evaluation metrics
 * Stores metrics for each tenant and flag combination
 */
@Entity('flag_evaluation_metrics')
export class EvaluationMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  @Index()
  flagKey: string;

  @Column()
  evaluationCount: number;

  @Column()
  successCount: number;

  @Column()
  errorCount: number;

  @Column()
  latencySum: number;

  @Column()
  @Index()
  periodStart: Date;

  @Column()
  periodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Helper method to calculate the average latency
   */
  get averageLatency(): number {
    if (this.evaluationCount === 0) {
      return 0;
    }
    return this.latencySum / this.evaluationCount;
  }

  /**
   * Helper method to calculate the success rate
   */
  get successRate(): number {
    if (this.evaluationCount === 0) {
      return 0;
    }
    return (this.successCount / this.evaluationCount) * 100;
  }
} 