import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto } from '@feature-flag-service/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FeatureFlagService {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createFeatureFlagDto: CreateFeatureFlagDto, userId: string): Promise<FeatureFlag> {
    const featureFlag = this.featureFlagRepository.create({
      ...createFeatureFlagDto,
      createdBy: userId,
      updatedBy: userId
    });
    return this.featureFlagRepository.save(featureFlag);
  }

  async findAll(tenantId: string): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      where: { tenantId },
      relations: ['targetingRules', 'versions']
    });
  }

  async findOne(id: string, tenantId: string): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { id, tenantId },
      relations: ['targetingRules', 'versions']
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID "${id}" not found`);
    }

    return featureFlag;
  }

  async update(id: string, tenantId: string, updateFeatureFlagDto: UpdateFeatureFlagDto, userId: string): Promise<FeatureFlag> {
    const featureFlag = await this.findOne(id, tenantId);
    
    Object.assign(featureFlag, {
      ...updateFeatureFlagDto,
      updatedBy: userId
    });

    const savedFlag = await this.featureFlagRepository.save(featureFlag);
    
    this.eventEmitter.emit('flag.updated', {
      id: savedFlag.id,
      key: savedFlag.key,
      tenantId: savedFlag.tenantId
    });
    
    return savedFlag;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const featureFlag = await this.findOne(id, tenantId);
    await this.featureFlagRepository.remove(featureFlag);
  }

  async findByKey(key: string, tenantId: string): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { key, tenantId },
      relations: ['targetingRules', 'versions']
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with key "${key}" not found`);
    }

    return featureFlag;
  }

  async toggleFlag(key: string, tenantId: string, enabled: boolean, userId: string): Promise<FeatureFlag> {
    const featureFlag = await this.findByKey(key, tenantId);
    
    featureFlag.enabled = enabled;
    featureFlag.updatedBy = userId;
    
    const savedFlag = await this.featureFlagRepository.save(featureFlag);
    
    this.eventEmitter.emit('flag.updated', {
      id: savedFlag.id,
      key: savedFlag.key,
      enabled: savedFlag.enabled,
      tenantId: savedFlag.tenantId
    });
    
    return savedFlag;
  }
} 