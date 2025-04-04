import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { TargetingRule } from '../entities/targeting-rule.entity';
import { Condition } from '../entities/condition.entity';
import { CreateTenantDto } from '@feature-flag-service/common';

/**
 * Service for automated tenant provisioning and management
 * This service handles operations for onboarding new tenants in a SaaS context
 */
@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);
  private readonly defaultFlags: any[];

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(FeatureFlag)
    private readonly flagRepository: Repository<FeatureFlag>,
    @InjectRepository(TargetingRule)
    private readonly ruleRepository: Repository<TargetingRule>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,
    private readonly configService: ConfigService
  ) {
    // Initialize default flags configuration from environment or config
    this.defaultFlags = this.configService.get('DEFAULT_FLAGS') || [
      { 
        key: 'dark-mode', 
        name: 'Dark Mode', 
        description: 'Enables dark mode UI', 
        enabled: false 
      },
      { 
        key: 'beta-features', 
        name: 'Beta Features', 
        description: 'Enables beta features', 
        enabled: false,
        rules: [
          {
            name: 'Beta Users',
            description: 'Enable for beta users',
            percentage: 100,
            enabled: true,
            conditions: [
              {
                attribute: 'userRole',
                operator: 'EQUALS',
                value: 'beta'
              }
            ]
          }
        ]
      },
      { 
        key: 'welcome-message', 
        name: 'Welcome Message', 
        description: 'Shows a welcome message to new users', 
        enabled: true 
      }
    ];
  }

  /**
   * Provision a new tenant with default configuration
   */
  async provisionTenant(
    createTenantDto: CreateTenantDto, 
    userId: string,
    options?: { 
      templateTenantId?: string, 
      skipDefaultFlags?: boolean,
      metadata?: Record<string, any> 
    }
  ): Promise<Tenant> {
    this.logger.log(`Provisioning new tenant: ${createTenantDto.name}`);
    
    try {
      // Create the tenant
      const tenant = this.tenantRepository.create({
        ...createTenantDto,
        createdBy: userId,
        updatedBy: userId
      });
      
      // Save the tenant
      const savedTenant = await this.tenantRepository.save(tenant);
      this.logger.log(`Created tenant: ${savedTenant.id}`);
      
      // If a template tenant ID is provided, copy its flags
      if (options?.templateTenantId) {
        await this.copyFlagsFromTenant(options.templateTenantId, savedTenant.id, userId);
      } 
      // Otherwise, create default flags unless explicitly skipped
      else if (!options?.skipDefaultFlags) {
        await this.createDefaultFlags(savedTenant.id, userId);
      }
      
      return savedTenant;
    } catch (error) {
      this.logger.error(`Failed to provision tenant: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create default feature flags for a tenant
   */
  private async createDefaultFlags(tenantId: string, userId: string): Promise<void> {
    this.logger.log(`Creating default flags for tenant: ${tenantId}`);
    
    for (const flagConfig of this.defaultFlags) {
      try {
        // Create the flag
        const flag = await this.flagRepository.save({
          key: flagConfig.key,
          name: flagConfig.name,
          description: flagConfig.description,
          enabled: flagConfig.enabled,
          tenantId,
          createdBy: userId,
          updatedBy: userId
        });
        
        // Create targeting rules if any
        if (flagConfig.rules && flagConfig.rules.length > 0) {
          for (const ruleConfig of flagConfig.rules) {
            const rule = await this.ruleRepository.save({
              name: ruleConfig.name,
              description: ruleConfig.description,
              percentage: ruleConfig.percentage,
              enabled: ruleConfig.enabled,
              featureFlagId: flag.id,
              createdBy: userId,
              updatedBy: userId
            });
            
            // Create conditions if any
            if (ruleConfig.conditions && ruleConfig.conditions.length > 0) {
              for (const conditionConfig of ruleConfig.conditions) {
                await this.conditionRepository.save({
                  attribute: conditionConfig.attribute,
                  operator: conditionConfig.operator,
                  value: conditionConfig.value,
                  targetingRuleId: rule.id,
                  createdBy: userId,
                  updatedBy: userId
                });
              }
            }
          }
        }
        
        this.logger.log(`Created default flag: ${flag.key} for tenant: ${tenantId}`);
      } catch (error) {
        this.logger.error(
          `Failed to create default flag ${flagConfig.key} for tenant ${tenantId}: ${error.message}`, 
          error.stack
        );
        // Continue with other flags even if one fails
      }
    }
  }

  /**
   * Copy feature flags from a template tenant
   */
  private async copyFlagsFromTenant(
    sourceTenantId: string, 
    targetTenantId: string,
    userId: string
  ): Promise<void> {
    this.logger.log(`Copying flags from tenant ${sourceTenantId} to ${targetTenantId}`);
    
    try {
      // Get all flags from the source tenant
      const sourceFlags = await this.flagRepository.find({
        where: { tenantId: sourceTenantId },
        relations: ['targetingRules', 'targetingRules.conditions']
      });
      
      for (const sourceFlag of sourceFlags) {
        // Create the flag in the target tenant
        const newFlag = await this.flagRepository.save({
          key: sourceFlag.key,
          name: sourceFlag.name,
          description: sourceFlag.description,
          enabled: sourceFlag.enabled,
          tenantId: targetTenantId,
          createdBy: userId,
          updatedBy: userId
        });
        
        // Copy targeting rules
        if (sourceFlag.targetingRules && sourceFlag.targetingRules.length > 0) {
          for (const rule of sourceFlag.targetingRules) {
            const newRule = await this.ruleRepository.save({
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
      }
      
      this.logger.log(`Successfully copied ${sourceFlags.length} flags to tenant ${targetTenantId}`);
    } catch (error) {
      this.logger.error(
        `Failed to copy flags from tenant ${sourceTenantId} to ${targetTenantId}: ${error.message}`, 
        error.stack
      );
      throw error;
    }
  }
} 