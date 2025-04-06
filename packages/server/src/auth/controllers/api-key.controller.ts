import { Controller, Get, Post, Delete, Param, Body, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { User } from '../decorators/user.decorator';
import { ApiKeyService } from '../services/api-key.service';
import { Permission } from '../entities/permission.entity';
import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Name of the API key' })
  @IsString()
  name: string;
  
  @ApiProperty({ description: 'Expiration date', required: false })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
}

export class AdminCreateApiKeyDto extends CreateApiKeyDto {
  @ApiProperty({ description: 'Tenant ID for the API key' })
  @IsString()
  tenantId: string;
}

@ApiTags('user-api-keys')
@Controller('users/me/apikeys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all API keys for the current user' })
  @ApiResponse({ status: 200, description: 'Returns all API keys for the user.' })
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_API_KEYS)
  async getUserApiKeys(@User('id') userId: string) {
    return this.apiKeyService.findAllByUserId(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API key for the current user' })
  @ApiResponse({ status: 201, description: 'API key created successfully.' })
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.CREATE_API_KEYS)
  async createApiKey(
    @User('id') userId: string,
    @User('tenantId') tenantId: string,
    @Body() createApiKeyDto: CreateApiKeyDto
  ) {
    return this.apiKeyService.create(userId, tenantId, createApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully.' })
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.REVOKE_API_KEYS)
  async revokeApiKey(
    @Param('id') id: string,
    @User('id') userId: string
  ) {
    // Verify ownership unless admin
    const apiKey = await this.apiKeyService.findById(id);
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }
    
    if (apiKey.userId !== userId) {
      throw new ForbiddenException('You do not have permission to revoke this API key');
    }

    return this.apiKeyService.revoke(id);
  }
}

@ApiTags('admin-api-keys')
@Controller('admin/users/:userId/apikeys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.MANAGE_ALL_API_KEYS, Permission.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all API keys for a user' })
  @ApiResponse({ status: 200, description: 'Returns all API keys for the specified user.' })
  async getUserApiKeys(@Param('userId') userId: string) {
    return this.apiKeyService.findAllByUserId(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new API key for a user' })
  @ApiResponse({ status: 201, description: 'API key created successfully.' })
  async createApiKey(
    @Param('userId') userId: string,
    @Body() createApiKeyDto: AdminCreateApiKeyDto
  ) {
    return this.apiKeyService.create(userId, createApiKeyDto.tenantId, createApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully.' })
  async revokeApiKey(@Param('id') id: string) {
    return this.apiKeyService.revoke(id);
  }
} 