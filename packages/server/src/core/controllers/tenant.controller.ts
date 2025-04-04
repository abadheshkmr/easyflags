import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantService } from '../services/tenant.service';
import { Tenant, CreateTenantDto, UpdateTenantDto } from '@feature-flag-service/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';

@ApiTags('tenants')
@Controller('api/v1/tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'The tenant has been successfully created.' })
  async create(
    @Body() createTenantDto: CreateTenantDto,
    @User('id') userId: string
  ): Promise<Tenant> {
    return this.tenantService.create(createTenantDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'Return all tenants.' })
  async findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  @ApiResponse({ status: 200, description: 'Return the tenant.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({ status: 200, description: 'The tenant has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @User('id') userId: string
  ): Promise<Tenant> {
    return this.tenantService.update(id, updateTenantDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiResponse({ status: 200, description: 'The tenant has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantService.remove(id);
  }
} 