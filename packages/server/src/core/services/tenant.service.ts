import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from '@feature-flag-service/common';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>
  ) {}

  async create(createTenantDto: CreateTenantDto, userId: string): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      createdBy: userId,
      updatedBy: userId
    });
    return this.tenantRepository.save(tenant);
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
    
    Object.assign(tenant, {
      ...updateTenantDto,
      updatedBy: userId
    });

    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
  }

  async findByName(name: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { name }
    });
  }
} 