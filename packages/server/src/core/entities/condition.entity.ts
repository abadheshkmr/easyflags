import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { TargetingRule } from './targeting-rule.entity';
import { ConditionOperator } from '@feature-flag-service/common';

@Entity()
export class Condition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  targetingRuleId: string;

  @ManyToOne(() => TargetingRule, rule => rule.conditions)
  targetingRule: TargetingRule;

  @Column()
  attribute: string;

  @Column({
    type: 'enum',
    enum: ConditionOperator
  })
  operator: ConditionOperator;

  @Column({ type: 'jsonb' })
  value: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;
} 