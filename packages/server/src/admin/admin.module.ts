import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { FeatureFlag, Tenant, TargetingRule, Condition } from '../core/entities';
import { AuthModule } from '../auth/auth.module';
import { PermissionConfigModule } from '../auth/config/permission-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureFlag,
      Tenant,
      TargetingRule,
      Condition
    ]),
    AuthModule,
    PermissionConfigModule
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService]
})
export class AdminModule {} 