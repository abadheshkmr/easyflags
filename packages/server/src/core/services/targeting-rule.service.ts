import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TargetingRule } from '../entities/targeting-rule.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { Condition } from '../entities/condition.entity';
import { CreateTargetingRuleDto, UpdateTargetingRuleDto } from '@feature-flag-service/common';

@Injectable()
export class TargetingRuleService {
  constructor(
    @InjectRepository(TargetingRule)
    private readonly targetingRuleRepository: Repository<TargetingRule>,
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>
  ) {}

  async create(featureFlagId: string, createTargetingRuleDto: CreateTargetingRuleDto, userId: string): Promise<TargetingRule> {
    // Verify feature flag exists
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { id: featureFlagId }
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID "${featureFlagId}" not found`);
    }

    // Create conditions first
    const conditions = await Promise.all(
      createTargetingRuleDto.conditions.map(conditionDto =>
        this.conditionRepository.save({
          ...conditionDto,
          createdBy: userId,
          updatedBy: userId
        })
      )
    );

    // Create the targeting rule
    const targetingRule = this.targetingRuleRepository.create({
      ...createTargetingRuleDto,
      featureFlagId,
      conditions,
      createdBy: userId,
      updatedBy: userId
    });

    return this.targetingRuleRepository.save(targetingRule);
  }

  async findAll(featureFlagId: string): Promise<TargetingRule[]> {
    return this.targetingRuleRepository.find({
      where: { featureFlagId },
      relations: ['conditions']
    });
  }

  async findOne(id: string, featureFlagId: string): Promise<TargetingRule> {
    const targetingRule = await this.targetingRuleRepository.findOne({
      where: { id, featureFlagId },
      relations: ['conditions']
    });

    if (!targetingRule) {
      throw new NotFoundException(`Targeting rule with ID "${id}" not found`);
    }

    return targetingRule;
  }

  async update(
    id: string,
    featureFlagId: string,
    updateTargetingRuleDto: UpdateTargetingRuleDto,
    userId: string
  ): Promise<TargetingRule> {
    const targetingRule = await this.findOne(id, featureFlagId);

    // Update conditions if provided
    if (updateTargetingRuleDto.conditions) {
      // Delete existing conditions
      await this.conditionRepository.delete({ targetingRuleId: id });

      // Create new conditions
      const conditions = await Promise.all(
        updateTargetingRuleDto.conditions.map(conditionDto =>
          this.conditionRepository.save({
            ...conditionDto,
            targetingRuleId: id,
            createdBy: userId,
            updatedBy: userId
          })
        )
      );

      targetingRule.conditions = conditions;
    }

    // Update other fields
    Object.assign(targetingRule, {
      ...updateTargetingRuleDto,
      updatedBy: userId
    });

    return this.targetingRuleRepository.save(targetingRule);
  }

  async remove(id: string, featureFlagId: string): Promise<void> {
    const result = await this.targetingRuleRepository.delete({ id, featureFlagId });

    if (result.affected === 0) {
      throw new NotFoundException(`Targeting rule with ID "${id}" not found`);
    }
  }

  async toggleEnabled(id: string, featureFlagId: string, enabled: boolean, userId: string): Promise<TargetingRule> {
    const targetingRule = await this.findOne(id, featureFlagId);
    targetingRule.enabled = enabled;
    targetingRule.updatedBy = userId;
    return this.targetingRuleRepository.save(targetingRule);
  }

  async updatePercentage(id: string, featureFlagId: string, percentage: number, userId: string): Promise<TargetingRule> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    const targetingRule = await this.findOne(id, featureFlagId);
    targetingRule.percentage = percentage;
    targetingRule.updatedBy = userId;
    return this.targetingRuleRepository.save(targetingRule);
  }

  async validateRules(featureFlagId: string): Promise<boolean> {
    const rules = await this.findAll(featureFlagId);
    const totalPercentage = rules.reduce((sum, rule) => sum + rule.percentage, 0);
    return totalPercentage <= 100;
  }
} 