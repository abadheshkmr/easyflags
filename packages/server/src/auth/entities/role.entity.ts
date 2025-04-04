import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Permission } from './permission.entity';
import { UserEntity } from './user.entity';

/**
 * Role entity for role-based access control
 * Each role contains a set of permissions
 */
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ unique: true })
  name: string;
  
  @Column({ nullable: true })
  description: string;
  
  @Column({
    type: 'simple-array',
    nullable: true
  })
  permissions: Permission[];
  
  @ManyToMany(() => UserEntity, user => user.roles)
  users: UserEntity[];
  
  @Column({ nullable: true })
  tenantId: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column()
  createdBy: string;
  
  @Column()
  updatedBy: string;
} 