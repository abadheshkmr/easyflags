import { Condition } from './condition';

export interface TargetingRule {
  id: string;
  featureFlagId: string;
  name: string;
  description?: string;
  conditions: Condition[];
  percentage: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateTargetingRuleDto {
  featureFlagId: string;
  name: string;
  description?: string;
  conditions: Condition[];
  percentage: number;
  enabled?: boolean;
}

export interface UpdateTargetingRuleDto {
  name?: string;
  description?: string;
  conditions?: Condition[];
  percentage?: number;
  enabled?: boolean;
} 