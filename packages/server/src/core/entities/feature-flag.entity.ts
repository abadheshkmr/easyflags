import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tenant } from './tenant.entity';
import { TargetingRule } from './targeting-rule.entity';
import { FlagVersion } from './flag-version.entity';

export enum FlagType {
  BOOLEAN = 'boolean',
  STRING = 'string',
  NUMBER = 'number',
  JSON = 'json'
}

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  key: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  enabled: boolean;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.featureFlags)
  tenant: Tenant;

  @OneToMany(() => TargetingRule, rule => rule.featureFlag, { cascade: true })
  targetingRules: TargetingRule[];

  @OneToMany(() => FlagVersion, version => version.featureFlag, { cascade: true })
  versions: FlagVersion[];

  @Column({ nullable: true })
  currentVersionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;
} 