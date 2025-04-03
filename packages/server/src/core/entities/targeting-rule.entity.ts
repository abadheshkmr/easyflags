import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { FeatureFlag } from './feature-flag.entity';
import { Condition } from './condition.entity';

@Entity()
export class TargetingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  featureFlagId: string;

  @ManyToOne(() => FeatureFlag, flag => flag.targetingRules)
  featureFlag: FeatureFlag;

  @OneToMany(() => Condition, condition => condition.targetingRule, { cascade: true })
  conditions: Condition[];

  @Column({ type: 'float', default: 100 })
  percentage: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;
} 