import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { FeatureFlag } from './feature-flag.entity';
import { TargetingRule } from './targeting-rule.entity';

@Entity()
export class FlagVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureFlagId: string;

  @ManyToOne(() => FeatureFlag, flag => flag.versions)
  featureFlag: FeatureFlag;

  @Column()
  version: number;

  @OneToMany(() => TargetingRule, rule => rule.featureFlag)
  targetingRules: TargetingRule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;
} 