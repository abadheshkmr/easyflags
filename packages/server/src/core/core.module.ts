import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { TenantController } from './controllers/tenant.controller';
import { TargetingRuleController } from './controllers/targeting-rule.controller';
import { FlagVersionController } from './controllers/flag-version.controller';
import { FeatureFlagService } from './services/feature-flag.service';
import { TenantService } from './services/tenant.service';
import { TargetingRuleService } from './services/targeting-rule.service';
import { FlagVersionService } from './services/flag-version.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { FeatureFlag } from './entities/feature-flag.entity';
import { Tenant } from './entities/tenant.entity';
import { TargetingRule } from './entities/targeting-rule.entity';
import { Condition } from './entities/condition.entity';
import { FlagVersion } from './entities/flag-version.entity';
import { AuditLogService } from './services/audit-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureFlag,
      Tenant,
      TargetingRule,
      Condition,
      FlagVersion,
    ]),
  ],
  controllers: [
    FeatureFlagController,
    TenantController,
    TargetingRuleController,
    FlagVersionController
  ],
  providers: [
    FeatureFlagService,
    TenantService,
    TargetingRuleService,
    FlagVersionService,
    TenantProvisioningService,
    AuditLogService
  ],
  exports: [
    FeatureFlagService,
    TenantService,
    TargetingRuleService,
    FlagVersionService,
    TenantProvisioningService,
    AuditLogService
  ],
})
export class CoreModule {} 