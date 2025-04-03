import { TargetingRule } from './targeting-rule';
import { FlagVersion } from './flag-version';

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description?: string;
  enabled: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  targetingRules: TargetingRule[];
  versions: FlagVersion[];
  currentVersionId?: string;
}

export interface CreateFeatureFlagDto {
  name: string;
  key: string;
  description?: string;
  enabled?: boolean;
  tenantId: string;
}

export interface UpdateFeatureFlagDto {
  name?: string;
  description?: string;
  enabled?: boolean;
} 