import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { TargetingRuleService } from '../services/targeting-rule.service';
import { TargetingRule, CreateTargetingRuleDto, UpdateTargetingRuleDto } from '@feature-flag-service/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';

@ApiTags('targeting-rules')
@Controller('api/v1/flags/:featureFlagId/rules')
@UseGuards(JwtAuthGuard)
export class TargetingRuleController {
  constructor(private readonly targetingRuleService: TargetingRuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new targeting rule' })
  @ApiResponse({ status: 201, description: 'The targeting rule has been successfully created.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async create(
    @Param('featureFlagId') featureFlagId: string,
    @Body() createTargetingRuleDto: CreateTargetingRuleDto,
    @User('id') userId: string
  ): Promise<TargetingRule> {
    return this.targetingRuleService.create(featureFlagId, createTargetingRuleDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all targeting rules for a feature flag' })
  @ApiResponse({ status: 200, description: 'Return all targeting rules.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async findAll(@Param('featureFlagId') featureFlagId: string): Promise<TargetingRule[]> {
    return this.targetingRuleService.findAll(featureFlagId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific targeting rule' })
  @ApiResponse({ status: 200, description: 'Return the targeting rule.' })
  @ApiResponse({ status: 404, description: 'Targeting rule not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async findOne(
    @Param('featureFlagId') featureFlagId: string,
    @Param('id') id: string
  ): Promise<TargetingRule> {
    return this.targetingRuleService.findOne(id, featureFlagId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a targeting rule' })
  @ApiResponse({ status: 200, description: 'The targeting rule has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Targeting rule not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async update(
    @Param('featureFlagId') featureFlagId: string,
    @Param('id') id: string,
    @Body() updateTargetingRuleDto: UpdateTargetingRuleDto,
    @User('id') userId: string
  ): Promise<TargetingRule> {
    return this.targetingRuleService.update(id, featureFlagId, updateTargetingRuleDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a targeting rule' })
  @ApiResponse({ status: 200, description: 'The targeting rule has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Targeting rule not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async remove(
    @Param('featureFlagId') featureFlagId: string,
    @Param('id') id: string
  ): Promise<void> {
    return this.targetingRuleService.remove(id, featureFlagId);
  }

  @Put(':id/enable')
  @ApiOperation({ summary: 'Enable a targeting rule' })
  @ApiResponse({ status: 200, description: 'The targeting rule has been enabled.' })
  @ApiResponse({ status: 404, description: 'Targeting rule not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async enable(
    @Param('featureFlagId') featureFlagId: string,
    @Param('id') id: string,
    @User('id') userId: string
  ): Promise<TargetingRule> {
    return this.targetingRuleService.toggleEnabled(id, featureFlagId, true, userId);
  }

  @Put(':id/disable')
  @ApiOperation({ summary: 'Disable a targeting rule' })
  @ApiResponse({ status: 200, description: 'The targeting rule has been disabled.' })
  @ApiResponse({ status: 404, description: 'Targeting rule not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async disable(
    @Param('featureFlagId') featureFlagId: string,
    @Param('id') id: string,
    @User('id') userId: string
  ): Promise<TargetingRule> {
    return this.targetingRuleService.toggleEnabled(id, featureFlagId, false, userId);
  }

  @Put(':id/percentage')
  @ApiOperation({ summary: 'Update the percentage of a targeting rule' })
  @ApiResponse({ status: 200, description: 'The percentage has been updated.' })
  @ApiResponse({ status: 404, description: 'Targeting rule not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async updatePercentage(
    @Param('featureFlagId') featureFlagId: string,
    @Param('id') id: string,
    @Body('percentage') percentage: number,
    @User('id') userId: string
  ): Promise<TargetingRule> {
    return this.targetingRuleService.updatePercentage(id, featureFlagId, percentage, userId);
  }
} 