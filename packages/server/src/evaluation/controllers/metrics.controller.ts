import { Controller, Get, Query, Headers, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CrossTenantGuard } from '../../auth/guards/cross-tenant.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Permission } from '../../auth/entities/permission.entity';
import { EvaluationMetricsService } from '../metrics/evaluation-metrics.service';

@ApiTags('metrics')
@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: EvaluationMetricsService) {}

  @Get('tenant')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CrossTenantGuard)
  @RequirePermissions(Permission.VIEW_FLAGS)
  @ApiOperation({ summary: 'Get metrics summary for a tenant' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO format)' })
  async getTenantMetrics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    
    return this.metricsService.getTenantMetricsSummary(tenantId, fromDate, toDate);
  }

  @Get('flag')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CrossTenantGuard)
  @RequirePermissions(Permission.VIEW_FLAGS)
  @ApiOperation({ summary: 'Get metrics for a specific flag' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  @ApiQuery({ name: 'flagKey', required: true, description: 'Feature flag key' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO format)' })
  async getFlagMetrics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('flagKey') flagKey: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    
    return this.metricsService.getMetricsForFlag(tenantId, flagKey, fromDate, toDate);
  }

  @Get('tenant/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.CROSS_TENANT_VIEW, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get metrics summary for all tenants (admin only)' })
  @ApiQuery({ name: 'tenantId', required: true, description: 'Tenant ID to get metrics for' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO format)' })
  async getAllTenantsMetrics(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    
    return this.metricsService.getTenantMetricsSummary(tenantId, fromDate, toDate);
  }
} 