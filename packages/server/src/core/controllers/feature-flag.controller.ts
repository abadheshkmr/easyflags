import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeatureFlagService } from '../services/feature-flag.service';
import { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto } from '@feature-flag-service/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';

@ApiTags('feature-flags')
@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'The feature flag has been successfully created.' })
  async create(
    @Body() createFeatureFlagDto: CreateFeatureFlagDto,
    @User('id') userId: string
  ): Promise<FeatureFlag> {
    return this.featureFlagService.create(createFeatureFlagDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all feature flags for a tenant' })
  @ApiResponse({ status: 200, description: 'Return all feature flags.' })
  async findAll(@Query('tenantId') tenantId: string): Promise<FeatureFlag[]> {
    return this.featureFlagService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a feature flag by ID' })
  @ApiResponse({ status: 200, description: 'Return the feature flag.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
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
  async update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
    @User('id') userId: string
  ): Promise<FeatureFlag> {
    return this.featureFlagService.update(id, tenantId, updateFeatureFlagDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiResponse({ status: 200, description: 'The feature flag has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  async remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ): Promise<void> {
    return this.featureFlagService.remove(id, tenantId);
  }
} 