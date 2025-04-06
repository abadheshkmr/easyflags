import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from '@feature-flag-service/common';
import { AuditLogService } from '../../common/audit/audit-log.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly auditLogService: AuditLogService
  ) {}

  async create(createTenantDto: CreateTenantDto, userId: string): Promise<Tenant> {
    // Check if tenant with the same name already exists
    const existingTenant = await this.findByName(createTenantDto.name);
    if (existingTenant) {
      throw new ConflictException(`Tenant with name "${createTenantDto.name}" already exists`);
    }
    
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      createdBy: userId,
      updatedBy: userId
    });
    
    const savedTenant = await this.tenantRepository.save(tenant);
    
    // Log the tenant creation
    this.auditLogService.logTenantCreation(
      savedTenant.id, 
      savedTenant.name, 
      userId, 
      'api'
    );
    
    return savedTenant;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: ['featureFlags']
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['featureFlags']
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, userId: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    // Keep track of changes for audit log
    const changes = {};
    for (const [key, value] of Object.entries(updateTenantDto)) {
      if (tenant[key] !== value) {
        changes[key] = { oldValue: tenant[key], newValue: value };
      }
    }
    
    Object.assign(tenant, {
      ...updateTenantDto,
      updatedBy: userId
    });

    const updatedTenant = await this.tenantRepository.save(tenant);
    
    // Log the tenant update
    this.auditLogService.logTenantUpdate(
      updatedTenant.id,
      updatedTenant.name,
      userId,
      changes
    );
    
    return updatedTenant;
  }

  async remove(id: string, userId: string): Promise<void> {
    const tenant = await this.findOne(id);
    
    // Store tenant details before deletion for logging
    const { id: tenantId, name: tenantName } = tenant;
    
    await this.tenantRepository.remove(tenant);
    
    // Log the tenant deletion
    this.auditLogService.logTenantDeletion(
      tenantId,
      tenantName,
      userId
    );
  }

  async findByName(name: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { name }
    });
  }
} 