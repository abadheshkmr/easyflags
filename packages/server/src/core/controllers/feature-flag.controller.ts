import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { FeatureFlagService } from '../services/feature-flag.service';
import { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto } from '@feature-flag-service/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';

@ApiTags('flags')
@Controller('api/v1/flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'The feature flag has been successfully created.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async create(
    @Body() createFeatureFlagDto: CreateFeatureFlagDto,
    @User('id') userId: string
  ): Promise<FeatureFlag> {
    return this.featureFlagService.create(createFeatureFlagDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all feature flags for a tenant' })
  @ApiResponse({ status: 200, description: 'Return all feature flags.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async findAll(@Query('tenantId') tenantId: string): Promise<FeatureFlag[]> {
    return this.featureFlagService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a feature flag by ID' })
  @ApiResponse({ status: 200, description: 'Return the feature flag.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ): Promise<FeatureFlag> {
    return this.featureFlagService.findOne(id, tenantId);
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get a feature flag by key' })
  @ApiResponse({ status: 200, description: 'Return the feature flag.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async findByKey(
    @Param('key') key: string,
    @Query('tenantId') tenantId: string
  ): Promise<FeatureFlag> {
    return this.featureFlagService.findByKey(key, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiResponse({ status: 200, description: 'The feature flag has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
    @User('id') userId: string
  ): Promise<FeatureFlag> {
    return this.featureFlagService.update(id, tenantId, updateFeatureFlagDto, userId);
  }

  @Patch(':key/toggle')
  @ApiOperation({ summary: 'Toggle a feature flag on/off' })
  @ApiResponse({ status: 200, description: 'The feature flag has been successfully toggled.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async toggleFlag(
    @Param('key') key: string,
    @Body() { enabled }: { enabled: boolean },
    @Query('tenantId') tenantId: string,
    @User('id') userId: string
  ): Promise<FeatureFlag> {
    return this.featureFlagService.toggleFlag(key, tenantId, enabled, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiResponse({ status: 200, description: 'The feature flag has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ): Promise<void> {
    return this.featureFlagService.remove(id, tenantId);
  }
} 