import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EvaluationMetrics } from './evaluation-metrics.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Service for tracking and recording feature flag evaluation metrics
 * Uses in-memory counters for real-time tracking and periodically flushes to database
 */
@Injectable()
export class EvaluationMetricsService {
  private readonly logger = new Logger(EvaluationMetricsService.name);
  private readonly aggregationPeriod: number; // minutes
  private readonly metricsEnabled: boolean;
  private readonly metricsQueue: Map<string, any> = new Map();
  private flushing = false;

  constructor(
    @InjectRepository(EvaluationMetrics)
    private readonly metricsRepository: Repository<EvaluationMetrics>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService
  ) {
    this.aggregationPeriod = this.configService.get<number>('METRICS_AGGREGATION_PERIOD_MINUTES', 5);
    this.metricsEnabled = this.configService.get<boolean>('ENABLE_METRICS', true);
    
    if (this.metricsEnabled) {
      this.logger.log(`Metrics tracking enabled with ${this.aggregationPeriod} minute aggregation period`);
    } else {
      this.logger.log('Metrics tracking disabled');
    }
  }

  /**
   * Record a flag evaluation event
   */
  async recordEvaluation(
    tenantId: string, 
    flagKey: string, 
    success: boolean, 
    latencyMs: number
  ): Promise<void> {
    if (!this.metricsEnabled) {
      return;
    }

    try {
      // Generate a cache key using the current time period
      const currentPeriod = this.getCurrentPeriod();
      const cacheKey = `metrics:${tenantId}:${flagKey}:${currentPeriod}`;
      
      // Get current metrics from cache or create new ones
      let metrics = await this.cacheManager.get<any>(cacheKey);
      
      if (!metrics) {
        metrics = {
          evaluationCount: 0,
          successCount: 0,
          errorCount: 0,
          latencySum: 0,
          periodStart: new Date(currentPeriod),
          periodEnd: this.getPeriodEnd(currentPeriod)
        };
      }
      
      // Update metrics
      metrics.evaluationCount++;
      success ? metrics.successCount++ : metrics.errorCount++;
      metrics.latencySum += latencyMs;
      
      // Store updated metrics in cache
      await this.cacheManager.set(cacheKey, metrics, this.aggregationPeriod * 60 * 2);
      
      // Queue for persistence
      this.queueMetricsForPersistence(tenantId, flagKey, currentPeriod);
    } catch (error) {
      this.logger.error(`Error recording metrics: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Get metrics for a specific tenant and flag
   */
  async getMetricsForFlag(
    tenantId: string, 
    flagKey: string, 
    from: Date, 
    to: Date
  ): Promise<EvaluationMetrics[]> {
    return this.metricsRepository.find({
      where: {
        tenantId,
        flagKey,
        periodStart: Between(from, to)
      },
      order: {
        periodStart: 'ASC'
      }
    });
  }
  
  /**
   * Get metrics summary for a tenant
   */
  async getTenantMetricsSummary(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<any> {
    // Get all metrics for this tenant in the given period
    const metrics = await this.metricsRepository.find({
      where: {
        tenantId,
        periodStart: Between(from, to)
      }
    });
    
    // Aggregate metrics by flag
    const flagMetrics = {};
    let totalEvaluations = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalLatency = 0;
    
    metrics.forEach(metric => {
      if (!flagMetrics[metric.flagKey]) {
        flagMetrics[metric.flagKey] = {
          evaluations: 0,
          success: 0,
          errors: 0,
          latency: 0
        };
      }
      
      flagMetrics[metric.flagKey].evaluations += metric.evaluationCount;
      flagMetrics[metric.flagKey].success += metric.successCount;
      flagMetrics[metric.flagKey].errors += metric.errorCount;
      flagMetrics[metric.flagKey].latency += metric.latencySum;
      
      totalEvaluations += metric.evaluationCount;
      totalSuccess += metric.successCount;
      totalErrors += metric.errorCount;
      totalLatency += metric.latencySum;
    });
    
    // Calculate averages
    Object.keys(flagMetrics).forEach(key => {
      const flag = flagMetrics[key];
      flag.averageLatency = flag.evaluations > 0 ? flag.latency / flag.evaluations : 0;
      flag.successRate = flag.evaluations > 0 ? (flag.success / flag.evaluations) * 100 : 0;
    });
    
    return {
      tenant: tenantId,
      period: { from, to },
      totalEvaluations,
      totalSuccess,
      totalErrors,
      averageLatency: totalEvaluations > 0 ? totalLatency / totalEvaluations : 0,
      successRate: totalEvaluations > 0 ? (totalSuccess / totalEvaluations) * 100 : 0,
      flags: flagMetrics
    };
  }

  /**
   * Queue metrics for persistence to avoid database writes on every evaluation
   */
  private queueMetricsForPersistence(tenantId: string, flagKey: string, period: string): void {
    const key = `${tenantId}:${flagKey}:${period}`;
    this.metricsQueue.set(key, { tenantId, flagKey, period });
  }
  
  /**
   * Get the current time period based on the aggregation interval
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    const periodNumber = Math.floor(minuteOfDay / this.aggregationPeriod);
    
    // Format: YYYY-MM-DD-HH-period
    return `${now.getFullYear()}-${this.pad(now.getMonth() + 1)}-${this.pad(now.getDate())}-${this.pad(now.getHours())}-${periodNumber}`;
  }
  
  /**
   * Get the end time for a period
   */
  private getPeriodEnd(periodStr: string): Date {
    const parts = periodStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const hour = parseInt(parts[3]);
    const period = parseInt(parts[4]);
    
    const date = new Date(year, month, day, hour, 0, 0, 0);
    date.setMinutes((period + 1) * this.aggregationPeriod);
    
    return date;
  }
  
  /**
   * Pad numbers with leading zeros
   */
  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
  
  /**
   * Scheduled task to flush metrics to the database
   * Runs every minute to ensure metrics are stored in a timely manner
   */
  @Cron('0 * * * * *')
  async flushMetrics(): Promise<void> {
    if (!this.metricsEnabled || this.flushing || this.metricsQueue.size === 0) {
      return;
    }
    
    this.flushing = true;
    const keysToProcess = [...this.metricsQueue.keys()];
    const processed = new Set<string>();
    
    try {
      this.logger.debug(`Flushing ${keysToProcess.length} metrics to database`);
      
      for (const key of keysToProcess) {
        const { tenantId, flagKey, period } = this.metricsQueue.get(key);
        const cacheKey = `metrics:${tenantId}:${flagKey}:${period}`;
        
        const metrics = await this.cacheManager.get<any>(cacheKey);
        if (!metrics) {
          processed.add(key);
          continue;
        }
        
        // Check if a record already exists for this period
        const existingMetric = await this.metricsRepository.findOne({
          where: {
            tenantId,
            flagKey,
            periodStart: metrics.periodStart
          }
        });
        
        if (existingMetric) {
          // Update existing record
          existingMetric.evaluationCount += metrics.evaluationCount;
          existingMetric.successCount += metrics.successCount;
          existingMetric.errorCount += metrics.errorCount;
          existingMetric.latencySum += metrics.latencySum;
          
          await this.metricsRepository.save(existingMetric);
        } else {
          // Create new record
          await this.metricsRepository.save({
            tenantId,
            flagKey,
            evaluationCount: metrics.evaluationCount,
            successCount: metrics.successCount,
            errorCount: metrics.errorCount,
            latencySum: metrics.latencySum,
            periodStart: metrics.periodStart,
            periodEnd: metrics.periodEnd
          });
        }
        
        // Mark as processed
        processed.add(key);
      }
    } catch (error) {
      this.logger.error(`Error flushing metrics: ${error.message}`, error.stack);
    } finally {
      // Remove processed items from queue
      processed.forEach(key => this.metricsQueue.delete(key));
      this.flushing = false;
    }
  }
} 