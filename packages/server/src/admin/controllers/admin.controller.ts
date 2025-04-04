import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CrossTenantGuard } from '../../auth/guards/cross-tenant.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Permission } from '../../auth/entities/permission.entity';
import { User } from '../../auth/decorators/user.decorator';
import { AdminService } from '../services/admin.service';

interface CopyFlagDto {
  flagId: string;
  sourceTenantId: string;
  targetTenantIds: string[];
}

@ApiTags('admin')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard, CrossTenantGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tenants/:tenantId/flags')
  @ApiOperation({ summary: 'Get all feature flags for a specific tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID of the tenant' })
  @RequirePermissions(Permission.CROSS_TENANT_VIEW, Permission.SUPER_ADMIN)
  async getFeatureFlagsByTenant(@Param('tenantId') tenantId: string) {
    return this.adminService.getFeatureFlagsByTenant(tenantId);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants' })
  @RequirePermissions(Permission.CROSS_TENANT_VIEW, Permission.SUPER_ADMIN, Permission.VIEW_TENANTS)
  async getAllTenants() {
    return this.adminService.getAllTenants();
  }

  @Post('flags/copy')
  @ApiOperation({ summary: 'Copy a feature flag from one tenant to others' })
  @RequirePermissions(Permission.CROSS_TENANT_EDIT, Permission.SUPER_ADMIN)
  async copyFeatureFlag(
    @Body() copyFlagDto: CopyFlagDto,
    @User('id') userId: string
  ) {
    return this.adminService.copyFeatureFlag(
      copyFlagDto.flagId,
      copyFlagDto.sourceTenantId,
      copyFlagDto.targetTenantIds,
      userId
    );
  }

  @Post('flags/sync')
  @ApiOperation({ summary: 'Sync a feature flag across all tenants' })
  @RequirePermissions(Permission.CROSS_TENANT_ADMIN, Permission.SUPER_ADMIN)
  @ApiQuery({ name: 'sourceTenantId', description: 'Source tenant ID for the template flags' })
  async syncFeatureFlags(
    @Query('sourceTenantId') sourceTenantId: string,
    @User('id') userId: string
  ) {
    return this.adminService.syncFlagsToAllTenants(sourceTenantId, userId);
  }
} 