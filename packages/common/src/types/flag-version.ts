import { TargetingRule } from './targeting-rule';
import { CreateTargetingRuleDto } from './targeting-rule';

export interface FlagVersion {
  id: string;
  featureFlagId: string;
  version: number;
  targetingRules: TargetingRule[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateFlagVersionDto {
  targetingRules: CreateTargetingRuleDto[];
}

export interface UpdateFlagVersionDto {
  targetingRules?: CreateTargetingRuleDto[];
} 