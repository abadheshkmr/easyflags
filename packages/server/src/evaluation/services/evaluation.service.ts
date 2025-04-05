import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FeatureFlag, TargetingRule, Condition } from '../../core/entities';
import { ConditionOperator } from '@feature-flag-service/common';
import { 
  EvaluationContext, 
  EvaluationResult, 
  BatchEvaluationResult,
  EvaluationSource,
  EvaluationReason,
  EvaluationMetric
} from '../interfaces/evaluation.interface';
import { 
  getNestedValue, 
  hashContext, 
  hashForPercentage 
} from '../utils/hash.util';
import { EvaluationMetricsService } from '../metrics/evaluation-metrics.service';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  private readonly FLAG_CACHE_TTL = 300000; // 5 minutes
  private readonly EVALUATION_CACHE_TTL = 60000; // 1 minute
  
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(TargetingRule)
    private readonly targetingRuleRepository: Repository<TargetingRule>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricsService: EvaluationMetricsService
  ) {}

  /**
   * Evaluate a feature flag for a given context
   */
  async evaluateFlag(key: string, context: EvaluationContext, tenantId: string): Promise<EvaluationResult> {
    const startTime = Date.now();
    let success = false;
    
    try {
      // Generate cache key for this evaluation
      const cacheKey = `eval:${tenantId}:${key}:${hashContext(context)}`;
      
      // Try cache first for maximum performance
      const cachedResult = await this.cacheManager.get<EvaluationResult>(cacheKey);
      if (cachedResult) {
        return {
          ...cachedResult,
          source: EvaluationSource.CACHE
        };
      }
      
      // Get flag definition with caching
      const flag = await this.getFlagDefinition(key, tenantId);
      if (!flag) {
        const result: EvaluationResult = { 
          value: undefined, 
          source: EvaluationSource.DEFAULT,
          reason: EvaluationReason.FLAG_NOT_FOUND
        };
        
        // Cache negative result too
        await this.cacheManager.set(cacheKey, result, this.EVALUATION_CACHE_TTL);
        return result;
      }
      
      // Evaluate flag
      const result = this.evaluateFlagRules(flag, context);
      
      // Cache result
      await this.cacheManager.set(cacheKey, result, this.EVALUATION_CACHE_TTL);
      
      // Record metrics
      const duration = Date.now() - startTime;
      this.recordEvaluationMetrics(key, duration, result.source);
      
      success = true;
      return result;
    } catch (error) {
      this.logger.error(`Error evaluating flag ${key}: ${error.message}`, error.stack);
      throw error;
    } finally {
      const latency = Date.now() - startTime;
      // Record metrics asynchronously (don't await to avoid blocking)
      this.metricsService.recordEvaluation(tenantId, key, success, latency)
        .catch(err => this.logger.error(`Failed to record metrics: ${err.message}`));
    }
  }

  /**
   * Batch evaluate multiple flags for the same context
   */
  async batchEvaluate(keys: string[], context: EvaluationContext, tenantId: string): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const results: Record<string, EvaluationResult> = {};
    const errors: Record<string, string> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        const flagStartTime = Date.now();
        let flagSuccess = false;
        
        try {
          const result = await this.evaluateFlag(key, context, tenantId);
          results[key] = result;
          flagSuccess = true;
        } catch (error) {
          this.logger.error(`Error evaluating flag ${key} in batch: ${error.message}`);
          errors[key] = error.message;
        } finally {
          const flagLatency = Date.now() - flagStartTime;
          // Record metrics for each flag asynchronously
          this.metricsService.recordEvaluation(tenantId, key, flagSuccess, flagLatency)
            .catch(err => this.logger.error(`Failed to record metrics for ${key}: ${err.message}`));
        }
      })
    );
    
    const latency = Date.now() - startTime;
    
    return {
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      metadata: {
        latencyMs: latency,
        evaluatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get a flag definition with caching
   */
  private async getFlagDefinition(key: string, tenantId: string): Promise<FeatureFlag | null> {
    const cacheKey = `flag:${tenantId}:${key}`;
    
    // Try cache first
    const cachedFlag = await this.cacheManager.get<FeatureFlag>(cacheKey);
    if (cachedFlag) {
      return cachedFlag;
    }
    
    // Get from database with all necessary relations
    const flag = await this.featureFlagRepository.findOne({
      where: { key, tenantId },
      relations: ['targetingRules', 'targetingRules.conditions']
    });
    
    if (flag) {
      // Cache flag definition
      await this.cacheManager.set(cacheKey, flag, this.FLAG_CACHE_TTL);
    }
    
    return flag || null;
  }

  /**
   * Evaluate a flag's rules against the given context
   */
  private evaluateFlagRules(flag: FeatureFlag, context: EvaluationContext): EvaluationResult {
    // If flag is disabled, return default value
    if (!flag.enabled) {
      return { 
        value: false, 
        source: EvaluationSource.DISABLED,
        reason: EvaluationReason.FLAG_DISABLED
      };
    }
    
    // Check targeting rules
    if (flag.targetingRules && flag.targetingRules.length > 0) {
      for (const rule of flag.targetingRules) {
        if (!rule.enabled) continue;
        
        if (this.matchesRule(rule, context)) {
          // Apply percentage rollout if needed
          if (rule.percentage < 100) {
            const userId = context.userId;
            if (!userId) continue;
            
            const hash = hashForPercentage(rule.id, userId);
            if (hash > rule.percentage) continue;
          }
          
          // Rule matched
          return { 
            value: true, 
            source: EvaluationSource.RULE,
            reason: `RULE_MATCH`,
            ruleId: rule.id
          };
        }
      }
    } else {
      // No rules defined
      return { 
        value: false, 
        source: EvaluationSource.DEFAULT,
        reason: EvaluationReason.NO_RULES
      };
    }
    
    // No rules matched
    return { 
      value: false, 
      source: EvaluationSource.DEFAULT,
      reason: EvaluationReason.NO_RULE_MATCH
    };
  }

  /**
   * Check if a context matches all conditions in a rule
   */
  private matchesRule(rule: TargetingRule, context: EvaluationContext): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true; // Rule with no conditions always matches
    }
    
    // All conditions must match
    for (const condition of rule.conditions) {
      if (!this.matchesCondition(condition, context)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if a context matches a condition
   */
  private matchesCondition(condition: Condition, context: EvaluationContext): boolean {
    const attributePath = condition.attribute;
    const contextValue = getNestedValue(context, attributePath);
    
    // If attribute doesn't exist in context and operator isn't specifically checking for null/empty
    if (contextValue === undefined && 
        ![ConditionOperator.IS_NULL, ConditionOperator.IS_NOT_NULL, 
          ConditionOperator.IS_EMPTY, ConditionOperator.IS_NOT_EMPTY].includes(condition.operator)) {
      return false;
    }
    
    // Evaluate based on operator
    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return contextValue === condition.value;
      case ConditionOperator.NOT_EQUALS:
        return contextValue !== condition.value;
      case ConditionOperator.CONTAINS:
        return String(contextValue).includes(String(condition.value));
      case ConditionOperator.NOT_CONTAINS:
        return !String(contextValue).includes(String(condition.value));
      case ConditionOperator.STARTS_WITH:
        return String(contextValue).startsWith(String(condition.value));
      case ConditionOperator.ENDS_WITH:
        return String(contextValue).endsWith(String(condition.value));
      case ConditionOperator.GREATER_THAN:
        return contextValue > condition.value;
      case ConditionOperator.LESS_THAN:
        return contextValue < condition.value;
      case ConditionOperator.GREATER_THAN_OR_EQUALS:
        return contextValue >= condition.value;
      case ConditionOperator.LESS_THAN_OR_EQUALS:
        return contextValue <= condition.value;
      case ConditionOperator.IN:
        return this.evaluateInOperator(contextValue, condition.value);
      case ConditionOperator.NOT_IN:
        return !this.evaluateInOperator(contextValue, condition.value);
      case ConditionOperator.IS_NULL:
        return contextValue === null;
      case ConditionOperator.IS_NOT_NULL:
        return contextValue !== null;
      case ConditionOperator.IS_EMPTY:
        return contextValue === '' || (Array.isArray(contextValue) && contextValue.length === 0);
      case ConditionOperator.IS_NOT_EMPTY:
        return contextValue !== '' && (!Array.isArray(contextValue) || contextValue.length > 0);
      default:
        return false;
    }
  }

  /**
   * Optimized IN operator evaluation using Set for small arrays and binary search for large ones
   */
  private evaluateInOperator(value: any, conditionValue: any): boolean {
    if (!Array.isArray(conditionValue)) {
      return false;
    }
    
    // For small arrays, use Set for O(1) lookups
    if (conditionValue.length <= 10) {
      const valueSet = new Set(conditionValue);
      return valueSet.has(value);
    }
    
    // For large arrays, use binary search for O(log n) lookups
    // First determine if we can sort (only works for strings or numbers)
    const firstItem = conditionValue[0];
    if (typeof firstItem === 'string' || typeof firstItem === 'number') {
      const sortedValues = [...conditionValue].sort();
      return this.binarySearch(sortedValues, value) !== -1;
    }
    
    // Fallback to linear search for mixed types
    return conditionValue.includes(value);
  }

  /**
   * Binary search implementation for optimized lookups in sorted arrays
   */
  private binarySearch(sortedArray: any[], target: any): number {
    let left = 0;
    let right = sortedArray.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
      if (sortedArray[mid] === target) {
        return mid;
      }
      
      if (sortedArray[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return -1;
  }

  /**
   * Record metrics for evaluation performance monitoring
   */
  private recordEvaluationMetrics(key: string, duration: number, source: EvaluationSource): void {
    const metric: EvaluationMetric = {
      key,
      duration,
      source,
      timestamp: Date.now()
    };
    
    this.eventEmitter.emit('flag.evaluated', metric);
    
    if (duration > 10) {
      this.logger.warn(`Slow flag evaluation: ${key} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Invalidate flag cache when flag is updated
   */
  async invalidateFlagCache(key: string, tenantId: string): Promise<void> {
    const cacheKey = `flag:${tenantId}:${key}`;
    await this.cacheManager.del(cacheKey);
    
    // Also emit event for flag change
    this.eventEmitter.emit('flag.changed', {
      key,
      tenantId,
      timestamp: Date.now()
    });
  }
}
