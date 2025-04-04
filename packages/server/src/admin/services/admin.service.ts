import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { FeatureFlag } from '../../core/entities/feature-flag.entity';
import { Tenant } from '../../core/entities/tenant.entity';
import { TargetingRule } from '../../core/entities/targeting-rule.entity';
import { Condition } from '../../core/entities/condition.entity';

/**
 * Service for admin operations that span across multiple tenants
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(FeatureFlag)
    private featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(TargetingRule)
    private targetingRuleRepository: Repository<TargetingRule>,
    @InjectRepository(Condition)
    private conditionRepository: Repository<Condition>
  ) {}

  /**
   * Get all feature flags for a specific tenant
   */
  async getFeatureFlagsByTenant(tenantId: string): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      where: { tenantId },
      relations: ['targetingRules', 'targetingRules.conditions']
    });
  }

  /**
   * Get all tenants
   */
  async getAllTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  /**
   * Copy a feature flag from one tenant to others
   */
  async copyFeatureFlag(
    flagId: string,
    sourceTenantId: string, 
    targetTenantIds: string[],
    userId: string
  ): Promise<{ success: boolean; message: string; results: any[] }> {
    // Find the source flag with all its rules and conditions
    const sourceFlag = await this.featureFlagRepository.findOne({
      where: { id: flagId, tenantId: sourceTenantId },
      relations: ['targetingRules', 'targetingRules.conditions']
    });

    if (!sourceFlag) {
      throw new NotFoundException(`Feature flag with ID ${flagId} not found in tenant ${sourceTenantId}`);
    }

    const results = [];

    // Copy to each target tenant
    for (const targetTenantId of targetTenantIds) {
      try {
        // Check if the tenant exists
        const targetTenant = await this.tenantRepository.findOne({ 
          where: { id: targetTenantId }
        });

        if (!targetTenant) {
          results.push({
            tenantId: targetTenantId,
            success: false,
            message: `Tenant with ID ${targetTenantId} not found`
          });
          continue;
        }

        // Check if a flag with the same key already exists for the target tenant
        const existingFlag = await this.featureFlagRepository.findOne({
          where: { key: sourceFlag.key, tenantId: targetTenantId }
        });

        if (existingFlag) {
          // Update existing flag
          await this.featureFlagRepository.update(existingFlag.id, {
            name: sourceFlag.name,
            description: sourceFlag.description,
            enabled: sourceFlag.enabled,
            updatedBy: userId
          });

          // Delete existing rules and recreate them
          await this.targetingRuleRepository.delete({ featureFlagId: existingFlag.id });

          // Copy the source rules
          if (sourceFlag.targetingRules && sourceFlag.targetingRules.length > 0) {
            for (const rule of sourceFlag.targetingRules) {
              const newRule = await this.targetingRuleRepository.save({
                name: rule.name,
                description: rule.description,
                percentage: rule.percentage,
                enabled: rule.enabled,
                featureFlagId: existingFlag.id,
                createdBy: userId,
                updatedBy: userId
              });

              // Copy conditions
              if (rule.conditions && rule.conditions.length > 0) {
                for (const condition of rule.conditions) {
                  await this.conditionRepository.save({
                    attribute: condition.attribute,
                    operator: condition.operator,
                    value: condition.value,
                    targetingRuleId: newRule.id,
                    createdBy: userId,
                    updatedBy: userId
                  });
                }
              }
            }
          }

          results.push({
            tenantId: targetTenantId,
            success: true,
            message: `Feature flag ${sourceFlag.key} updated successfully`,
            flagId: existingFlag.id
          });
        } else {
          // Create new flag
          const newFlag = await this.featureFlagRepository.save({
            key: sourceFlag.key,
            name: sourceFlag.name,
            description: sourceFlag.description,
            enabled: sourceFlag.enabled,
            tenantId: targetTenantId,
            createdBy: userId,
            updatedBy: userId
          });

          // Copy rules
          if (sourceFlag.targetingRules && sourceFlag.targetingRules.length > 0) {
            for (const rule of sourceFlag.targetingRules) {
              const newRule = await this.targetingRuleRepository.save({
                name: rule.name,
                description: rule.description,
                percentage: rule.percentage,
                enabled: rule.enabled,
                featureFlagId: newFlag.id,
                createdBy: userId,
                updatedBy: userId
              });

              // Copy conditions
              if (rule.conditions && rule.conditions.length > 0) {
                for (const condition of rule.conditions) {
                  await this.conditionRepository.save({
                    attribute: condition.attribute,
                    operator: condition.operator,
                    value: condition.value,
                    targetingRuleId: newRule.id,
                    createdBy: userId,
                    updatedBy: userId
                  });
                }
              }
            }
          }

          results.push({
            tenantId: targetTenantId,
            success: true,
            message: `Feature flag ${sourceFlag.key} created successfully`,
            flagId: newFlag.id
          });
        }
      } catch (error) {
        results.push({
          tenantId: targetTenantId,
          success: false,
          message: `Error copying flag: ${error.message}`
        });
      }
    }

    return { 
      success: results.every(r => r.success),
      message: `Flag copied to ${results.filter(r => r.success).length}/${targetTenantIds.length} tenants`,
      results
    };
  }

  /**
   * Sync flags from a source tenant to all other tenants
   */
  async syncFlagsToAllTenants(
    sourceTenantId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; results: any[] }> {
    // Get all tenants except the source tenant
    const allTenants = await this.tenantRepository.find({
      where: { 
        id: Not(sourceTenantId)
      }
    });

    const targetTenantIds = allTenants.map(tenant => tenant.id);
    
    // Get all flags from the source tenant
    const sourceFlags = await this.featureFlagRepository.find({
      where: { tenantId: sourceTenantId },
      relations: ['targetingRules', 'targetingRules.conditions']
    });

    const results = [];

    // Copy each flag to all tenants
    for (const flag of sourceFlags) {
      try {
        const copyResult = await this.copyFeatureFlag(
          flag.id,
          sourceTenantId,
          targetTenantIds,
          userId
        );

        results.push({
          flagKey: flag.key,
          ...copyResult
        });
      } catch (error) {
        results.push({
          flagKey: flag.key,
          success: false,
          message: `Error syncing flag: ${error.message}`,
          results: []
        });
      }
    }

    return {
      success: results.every(r => r.success),
      message: `Synced ${results.filter(r => r.success).length}/${sourceFlags.length} flags to all tenants`,
      results
    };
  }
} 