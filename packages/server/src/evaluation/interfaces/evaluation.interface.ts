import { FeatureFlag, TargetingRule, Condition } from '../../core/entities';

export interface EvaluationContext {
  [key: string]: any;
  userId?: string;
  userRole?: string;
  deviceType?: string;
  userGroups?: string[];
  tenantId?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export enum EvaluationSource {
  RULE = 'RULE',
  DEFAULT = 'DEFAULT',
  DISABLED = 'DISABLED',
  ERROR = 'ERROR',
  CACHE = 'CACHE'
}

export enum EvaluationReason {
  FLAG_DISABLED = 'FLAG_DISABLED',
  FLAG_NOT_FOUND = 'FLAG_NOT_FOUND',
  EVALUATION_ERROR = 'EVALUATION_ERROR',
  NO_RULE_MATCH = 'NO_RULE_MATCH',
  NO_RULES = 'NO_RULES'
}

export interface EvaluationResult {
  value: any;
  source: EvaluationSource;
  reason?: EvaluationReason | string;
  ruleId?: string;
  timestamp?: number;
}

export interface BatchEvaluationRequest {
  keys: string[];
  context: EvaluationContext;
}

export interface BatchEvaluationResult {
  results: Record<string, EvaluationResult>;
}

export interface FlagChangedEvent {
  key: string;
  tenantId?: string;
  timestamp: number;
}

export interface CompiledRule {
  id: string;
  percentage: number;
  evaluate: (context: EvaluationContext) => boolean;
}

export interface EvaluationMetric {
  key: string;
  duration: number;
  source: EvaluationSource;
  timestamp: number;
}
