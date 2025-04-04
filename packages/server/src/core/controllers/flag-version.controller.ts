import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { FlagVersionService } from '../services/flag-version.service';
import { FlagVersion, CreateFlagVersionDto } from '@feature-flag-service/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';

@ApiTags('flag-versions')
@Controller('api/v1/flags/:featureFlagId/versions')
@UseGuards(JwtAuthGuard)
export class FlagVersionController {
  constructor(private readonly flagVersionService: FlagVersionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new flag version' })
  @ApiResponse({ status: 201, description: 'The flag version has been successfully created.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async create(
    @Param('featureFlagId') featureFlagId: string,
    @Body() createFlagVersionDto: CreateFlagVersionDto,
    @User('id') userId: string
  ): Promise<FlagVersion> {
    return this.flagVersionService.create(featureFlagId, createFlagVersionDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all versions of a feature flag' })
  @ApiResponse({ status: 200, description: 'Return all flag versions.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async findAll(@Param('featureFlagId') featureFlagId: string): Promise<FlagVersion[]> {
    return this.flagVersionService.findAll(featureFlagId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the current version of a feature flag' })
  @ApiResponse({ status: 200, description: 'Return the current flag version.' })
  @ApiResponse({ status: 404, description: 'Feature flag or version not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async getCurrentVersion(@Param('featureFlagId') featureFlagId: string): Promise<FlagVersion> {
    return this.flagVersionService.getCurrentVersion(featureFlagId);
  }

  @Get(':version')
  @ApiOperation({ summary: 'Get a specific version of a feature flag' })
  @ApiResponse({ status: 200, description: 'Return the flag version.' })
  @ApiResponse({ status: 404, description: 'Version not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async findByVersion(
    @Param('featureFlagId') featureFlagId: string,
    @Param('version') version: number
  ): Promise<FlagVersion> {
    return this.flagVersionService.findByVersion(featureFlagId, version);
  }

  @Post(':version/rollback')
  @ApiOperation({ summary: 'Rollback to a specific version' })
  @ApiResponse({ status: 201, description: 'The flag has been rolled back successfully.' })
  @ApiResponse({ status: 404, description: 'Version not found.' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async rollback(
    @Param('featureFlagId') featureFlagId: string,
    @Param('version') version: number,
    @User('id') userId: string
  ): Promise<FlagVersion> {
    return this.flagVersionService.rollback(featureFlagId, version, userId);
  }
} 