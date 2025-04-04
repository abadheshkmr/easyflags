import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User, UserRole } from '@feature-flag-service/common';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('users')
export class UserEntity implements User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ nullable: true })
  tenantId?: string;

  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];

  @Column('simple-array', { nullable: true })
  directPermissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Helper method to check if the user has a specific permission
   * Checks both direct permissions and role-based permissions
   */
  hasPermission(permission: Permission): boolean {
    // Check direct permissions
    if (this.directPermissions?.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    if (this.roles) {
      for (const role of this.roles) {
        if (role.permissions?.includes(permission)) {
          return true;
        }
      }
    }
    
    // Super admin role always has all permissions
    if (this.role === UserRole.ADMIN) {
      return true;
    }

    return false;
  }

  /**
   * Helper method to check if the user has cross-tenant access
   */
  hasCrossTenantAccess(): boolean {
    return this.hasPermission(Permission.CROSS_TENANT_VIEW) || 
           this.hasPermission(Permission.CROSS_TENANT_EDIT) || 
           this.hasPermission(Permission.CROSS_TENANT_ADMIN) ||
           this.hasPermission(Permission.SUPER_ADMIN);
  }
} 