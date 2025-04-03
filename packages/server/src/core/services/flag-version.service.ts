import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlagVersion } from '../entities/flag-version.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { TargetingRule } from '../entities/targeting-rule.entity';
import { CreateFlagVersionDto } from '@feature-flag-service/common';

@Injectable()
export class FlagVersionService {
  constructor(
    @InjectRepository(FlagVersion)
    private readonly flagVersionRepository: Repository<FlagVersion>,
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(TargetingRule)
    private readonly targetingRuleRepository: Repository<TargetingRule>
  ) {}

  async create(featureFlagId: string, createFlagVersionDto: CreateFlagVersionDto, userId: string): Promise<FlagVersion> {
    // Verify feature flag exists
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { id: featureFlagId },
      relations: ['versions']
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID "${featureFlagId}" not found`);
    }

    // Get the next version number
    const nextVersion = featureFlag.versions.length + 1;

    // Create targeting rules for the new version
    const targetingRules = await Promise.all(
      createFlagVersionDto.targetingRules.map(ruleDto =>
        this.targetingRuleRepository.save({
          ...ruleDto,
          featureFlagId,
          createdBy: userId,
          updatedBy: userId
        })
      )
    );

    // Create the new version
    const flagVersion = this.flagVersionRepository.create({
      featureFlagId,
      version: nextVersion,
      targetingRules,
      createdBy: userId,
      updatedBy: userId
    });

    const savedVersion = await this.flagVersionRepository.save(flagVersion);

    // Update the feature flag's current version
    await this.featureFlagRepository.update(featureFlagId, {
      currentVersionId: savedVersion.id,
      updatedBy: userId
    });

    return savedVersion;
  }

  async findAll(featureFlagId: string): Promise<FlagVersion[]> {
    return this.flagVersionRepository.find({
      where: { featureFlagId },
      relations: ['targetingRules', 'targetingRules.conditions'],
      order: { version: 'DESC' }
    });
  }

  async findOne(id: string, featureFlagId: string): Promise<FlagVersion> {
    const flagVersion = await this.flagVersionRepository.findOne({
      where: { id, featureFlagId },
      relations: ['targetingRules', 'targetingRules.conditions']
    });

    if (!flagVersion) {
      throw new NotFoundException(`Flag version with ID "${id}" not found`);
    }

    return flagVersion;
  }

  async findByVersion(featureFlagId: string, version: number): Promise<FlagVersion> {
    const flagVersion = await this.flagVersionRepository.findOne({
      where: { featureFlagId, version },
      relations: ['targetingRules', 'targetingRules.conditions']
    });

    if (!flagVersion) {
      throw new NotFoundException(`Version ${version} not found for feature flag "${featureFlagId}"`);
    }

    return flagVersion;
  }

  async rollback(featureFlagId: string, version: number, userId: string): Promise<FlagVersion> {
    const targetVersion = await this.findByVersion(featureFlagId, version);
    
    // Create a new version with the same targeting rules
    const createDto: CreateFlagVersionDto = {
      targetingRules: targetVersion.targetingRules.map(rule => ({
        featureFlagId,
        name: rule.name,
        description: rule.description,
        conditions: rule.conditions,
        percentage: rule.percentage,
        enabled: rule.enabled
      }))
    };

    return this.create(featureFlagId, createDto, userId);
  }

  async getCurrentVersion(featureFlagId: string): Promise<FlagVersion> {
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { id: featureFlagId },
      relations: ['versions']
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID "${featureFlagId}" not found`);
    }

    if (!featureFlag.currentVersionId) {
      throw new BadRequestException(`Feature flag "${featureFlagId}" has no current version`);
    }

    return this.findOne(featureFlag.currentVersionId, featureFlagId);
  }
} 