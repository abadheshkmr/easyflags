import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { PermissionConfigService } from '../config/permission-config.service';
import { Permission } from '../entities/permission.entity';
import { UserRole } from '@feature-flag-service/common';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private permissionConfigService: PermissionConfigService,
  ) {}

  /**
   * Assign default permissions to a user based on their role
   * @param userId The user ID to assign permissions to
   * @param role The role string (defaults to 'user')
   */
  async assignDefaultPermissionsToUser(userId: string, roleName: string = 'user'): Promise<void> {
    try {
      // Get the user
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['roles'] 
      });
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Get permissions for the role from centralized config
      const permissionNames = this.permissionConfigService.getPermissionsForRole(roleName);
      
      // Create or get the role entity
      let roleEntity = await this.roleRepository.findOne({ where: { name: roleName } });
      
      if (!roleEntity) {
        // Create new role
        roleEntity = new Role();
        roleEntity.name = roleName;
        roleEntity.description = this.permissionConfigService.getAllRoleDefinitions()[roleName]?.description || `${roleName} role`;
        roleEntity.permissions = [];
        roleEntity.createdBy = userId;
        roleEntity.updatedBy = userId;
        await this.roleRepository.save(roleEntity);
      }
      
      // Convert permission names to enum values
      const permissions = this.mapToPermissionEnum(permissionNames);
      
      // Update role permissions
      roleEntity.permissions = permissions;
      await this.roleRepository.save(roleEntity);
      
      // Assign role to user
      if (!user.roles) {
        user.roles = [];
      }
      
      if (!user.roles.some(r => r.id === roleEntity.id)) {
        user.roles.push(roleEntity);
      }
      
      // Update user's role enum
      user.role = this.mapRoleNameToEnum(roleName);
      
      await this.userRepository.save(user);
      
      this.logger.log(`Assigned ${permissions.length} permissions to user ${userId} with role ${roleName}`);
    } catch (error) {
      this.logger.error(`Error assigning permissions to user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Check if a user has a specific permission
   * @param userId The user ID to check
   * @param permission The permission to check for
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles']
      });
      
      if (!user) {
        return false;
      }
      
      // Super admin has all permissions
      if (user.role === UserRole.ADMIN || this.hasSuperAdminRole(user)) {
        return true;
      }
      
      // Convert the permission name to enum value if necessary
      const permission = this.getPermissionEnum(permissionName);
      
      // Check direct permissions
      if (user.directPermissions?.includes(permission)) {
        return true;
      }
      
      // Check role permissions
      return user.roles?.some(role => 
        role.permissions?.includes(permission)
      ) ?? false;
    } catch (error) {
      this.logger.error(`Error checking permission ${permissionName} for user ${userId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check if a user has all of the specified permissions
   * @param userId The user ID to check
   * @param permissions Array of permissions to check
   */
  async hasPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles']
      });
      
      if (!user) {
        return false;
      }
      
      // Super admin has all permissions
      if (user.role === UserRole.ADMIN || this.hasSuperAdminRole(user)) {
        return true;
      }
      
      // Convert permission names to enum values
      const permissions = permissionNames.map(name => this.getPermissionEnum(name));
      
      // Check direct permissions
      const directPermissionSet = new Set(user.directPermissions || []);
      
      // Check role permissions
      const rolePermissions = new Set<Permission>();
      user.roles?.forEach(role => {
        role.permissions?.forEach(perm => rolePermissions.add(perm));
      });
      
      // Check if all required permissions are included
      return permissions.every(permission => 
        directPermissionSet.has(permission) || rolePermissions.has(permission)
      );
    } catch (error) {
      this.logger.error(`Error checking permissions for user ${userId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get all permissions for a user
   * @param userId The user ID
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles']
      });
      
      if (!user) {
        return [];
      }
      
      // If user is super admin, return all permissions
      if (user.role === UserRole.ADMIN || this.hasSuperAdminRole(user)) {
        return Object.keys(this.permissionConfigService.getAllPermissions());
      }
      
      // Collect permissions from roles
      const permissionSet = new Set<Permission>();
      
      // Add direct permissions
      if (user.directPermissions) {
        user.directPermissions.forEach(perm => permissionSet.add(perm));
      }
      
      // Add role permissions
      if (user.roles) {
        user.roles.forEach(role => {
          if (role.permissions) {
            role.permissions.forEach(perm => permissionSet.add(perm));
          }
        });
      }
      
      // Convert enum values to strings
      return Array.from(permissionSet).map(perm => perm.toString());
    } catch (error) {
      this.logger.error(`Error getting permissions for user ${userId}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Update a user's role
   * @param userId The user ID
   * @param roleName The new role name
   */
  async updateUserRole(userId: string, roleName: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['roles'] 
      });
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Get or create the role
      let roleEntity = await this.roleRepository.findOne({ where: { name: roleName } });
      if (!roleEntity) {
        // Role doesn't exist yet, create it with default permissions
        await this.assignDefaultPermissionsToUser(userId, roleName);
        return;
      }
      
      // Update user's role enum
      user.role = this.mapRoleNameToEnum(roleName);
      
      // Update user's roles collection
      if (!user.roles) {
        user.roles = [];
      }
      
      // Add the role if not already there
      if (!user.roles.some(r => r.id === roleEntity.id)) {
        user.roles.push(roleEntity);
      }
      
      await this.userRepository.save(user);
      
      this.logger.log(`Updated role for user ${userId} to ${roleName}`);
    } catch (error) {
      this.logger.error(`Error updating role for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Maps permission name strings to Permission enum values
   */
  private mapToPermissionEnum(permissionNames: string[]): Permission[] {
    return permissionNames.map(name => this.getPermissionEnum(name));
  }
  
  /**
   * Get a Permission enum value from a permission name string
   */
  private getPermissionEnum(permissionName: string): Permission {
    // Handle case when permission is already an enum
    if (typeof permissionName !== 'string') {
      return permissionName;
    }
    
    // The existing Permission entity is an enum
    const enumKey = Object.keys(Permission).find(
      key => Permission[key] === permissionName
    );
    
    if (!enumKey) {
      this.logger.warn(`Permission '${permissionName}' not found in Permission enum`);
      return permissionName as any; // Fallback to using the string as-is
    }
    
    return Permission[enumKey];
  }
  
  /**
   * Map role name to UserRole enum
   */
  private mapRoleNameToEnum(roleName: string): UserRole {
    switch (roleName.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return UserRole.ADMIN;
      case 'tenant_admin':
        // If TENANT_ADMIN doesn't exist, fall back to USER
        return UserRole['TENANT_ADMIN'] || UserRole.USER;
      default:
        return UserRole.USER;
    }
  }
  
  /**
   * Check if user has super admin permissions
   */
  private hasSuperAdminRole(user: UserEntity): boolean {
    return user.roles?.some(role => 
      role.permissions?.includes(Permission.SUPER_ADMIN)
    ) ?? false;
  }

  /**
   * Get all available permissions in the system
   */
  async getAllAvailablePermissions(): Promise<Record<string, any>> {
    return this.permissionConfigService.getAllPermissions();
  }

  /**
   * Get all roles in the system
   */
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      relations: ['permissions']
    });
  }

  /**
   * Assign permissions to a user
   * @param userId The ID of the user to assign permissions to
   * @param permissions Array of permission names to assign
   * @param adminId ID of the admin making the change
   */
  async assignPermissionsToUser(userId: string, permissions: string[], adminId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles']
      });
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Convert permission names to enum values
      const permissionEnums = this.mapToPermissionEnum(permissions);
      
      // Initialize directPermissions if it doesn't exist
      if (!user.directPermissions) {
        user.directPermissions = [];
      }
      
      // Add new permissions
      for (const permission of permissionEnums) {
        if (!user.directPermissions.includes(permission)) {
          user.directPermissions.push(permission);
        }
      }
      
      await this.userRepository.save(user);
      
      this.logger.log(`Admin ${adminId} assigned permissions [${permissions.join(', ')}] to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error assigning permissions to user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Revoke permissions from a user
   * @param userId The ID of the user to revoke permissions from
   * @param permissions Array of permission names to revoke
   * @param adminId ID of the admin making the change
   */
  async revokePermissionsFromUser(userId: string, permissions: string[], adminId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles']
      });
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Convert permission names to enum values
      const permissionEnums = this.mapToPermissionEnum(permissions);
      
      // If user has no direct permissions, nothing to do
      if (!user.directPermissions || user.directPermissions.length === 0) {
        return;
      }
      
      // Remove specified permissions
      user.directPermissions = user.directPermissions.filter(
        permission => !permissionEnums.includes(permission)
      );
      
      await this.userRepository.save(user);
      
      this.logger.log(`Admin ${adminId} revoked permissions [${permissions.join(', ')}] from user ${userId}`);
    } catch (error) {
      this.logger.error(`Error revoking permissions from user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update or create a role
   * @param name Role name
   * @param description Role description
   * @param permissions Array of permission names for this role
   * @param adminId ID of the admin making the change
   */
  async updateRole(name: string, description: string, permissions: string[], adminId: string): Promise<Role> {
    try {
      // Check if role exists
      let role = await this.roleRepository.findOne({
        where: { name }
      });
      
      // Convert permission names to enum values
      const permissionEnums = this.mapToPermissionEnum(permissions);
      
      if (!role) {
        // Create a new role
        role = new Role();
        role.name = name;
        role.createdBy = adminId;
        role.createdAt = new Date();
      }
      
      // Update role
      role.description = description;
      role.permissions = permissionEnums;
      role.updatedBy = adminId;
      role.updatedAt = new Date();
      
      await this.roleRepository.save(role);
      
      this.logger.log(`Admin ${adminId} updated role ${name} with ${permissions.length} permissions`);
      return role;
    } catch (error) {
      this.logger.error(`Error updating role ${name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a role
   * @param name Role name to delete
   * @param adminId ID of the admin making the change
   */
  async deleteRole(name: string, adminId: string): Promise<void> {
    try {
      // Find role
      const role = await this.roleRepository.findOne({
        where: { name },
        relations: ['users']
      });
      
      if (!role) {
        throw new Error(`Role with name ${name} not found`);
      }
      
      // Check if role is assigned to any users
      if (role.users && role.users.length > 0) {
        throw new Error(`Cannot delete role ${name} because it is assigned to ${role.users.length} users`);
      }
      
      // Delete role
      await this.roleRepository.remove(role);
      
      this.logger.log(`Admin ${adminId} deleted role ${name}`);
    } catch (error) {
      this.logger.error(`Error deleting role ${name}: ${error.message}`, error.stack);
      throw error;
    }
  }
} 