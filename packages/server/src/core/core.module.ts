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
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../common/audit/audit-log.module';
import { PermissionConfigModule } from '../auth/config/permission-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureFlag,
      Tenant,
      TargetingRule,
      Condition,
      FlagVersion,
    ]),
    AuthModule,
    AuditLogModule,
    PermissionConfigModule,
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
  ],
  exports: [
    FeatureFlagService,
    TenantService,
    TargetingRuleService,
    FlagVersionService,
    TenantProvisioningService,
  ],
})
export class CoreModule {} 