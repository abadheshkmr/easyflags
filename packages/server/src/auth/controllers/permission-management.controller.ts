import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { Permission } from '../entities/permission.entity';
import { PermissionService } from '../services/permission.service';
import { UserService } from '../services/user.service';
import { User } from '../decorators/user.decorator';

// DTOs for the controller
class AssignPermissionDto {
  userId: string;
  permissions: string[];
}

class AssignRoleDto {
  userId: string;
  role: string;
}

class UpdateRoleDto {
  name: string;
  description: string;
  permissions: string[];
}

@ApiTags('permissions')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PermissionManagementController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly userService: UserService
  ) {}

  // Get all permissions in the system
  @Get('all')
  @RequirePermissions(Permission.ASSIGN_PERMISSIONS, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'Return all available permissions.' })
  async getAllPermissions() {
    return this.permissionService.getAllAvailablePermissions();
  }

  // Get all roles in the system
  @Get('roles')
  @RequirePermissions(Permission.ASSIGN_ROLES, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Return all roles.' })
  async getAllRoles() {
    return this.permissionService.getAllRoles();
  }

  // Get a user's permissions
  @Get('users/:userId')
  @RequirePermissions(Permission.VIEW_USERS, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get permissions for a user' })
  @ApiResponse({ status: 200, description: 'Return permissions for the user.' })
  async getUserPermissions(@Param('userId') userId: string) {
    try {
      const permissions = await this.permissionService.getUserPermissions(userId);
      const user = await this.userService.findUserById(userId);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        permissions,
        roles: user.roles || []
      };
    } catch (error) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  // Assign permissions to a user
  @Post('assign')
  @RequirePermissions(Permission.ASSIGN_PERMISSIONS, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign permissions to a user' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully.' })
  async assignPermissions(
    @Body() assignPermissionDto: AssignPermissionDto,
    @User('id') adminId: string
  ) {
    try {
      await this.permissionService.assignPermissionsToUser(
        assignPermissionDto.userId,
        assignPermissionDto.permissions,
        adminId
      );
      
      return { 
        success: true, 
        message: 'Permissions assigned successfully',
        userId: assignPermissionDto.userId,
        permissions: assignPermissionDto.permissions
      };
    } catch (error) {
      throw new BadRequestException(`Failed to assign permissions: ${error.message}`);
    }
  }

  // Revoke permissions from a user
  @Post('revoke')
  @RequirePermissions(Permission.ASSIGN_PERMISSIONS, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revoke permissions from a user' })
  @ApiResponse({ status: 200, description: 'Permissions revoked successfully.' })
  async revokePermissions(
    @Body() assignPermissionDto: AssignPermissionDto,
    @User('id') adminId: string
  ) {
    try {
      await this.permissionService.revokePermissionsFromUser(
        assignPermissionDto.userId,
        assignPermissionDto.permissions,
        adminId
      );
      
      return { 
        success: true, 
        message: 'Permissions revoked successfully',
        userId: assignPermissionDto.userId,
        permissions: assignPermissionDto.permissions
      };
    } catch (error) {
      throw new BadRequestException(`Failed to revoke permissions: ${error.message}`);
    }
  }

  // Assign role to a user
  @Post('roles/assign')
  @RequirePermissions(Permission.ASSIGN_ROLES, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully.' })
  async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
    @User('id') adminId: string
  ) {
    try {
      await this.permissionService.updateUserRole(
        assignRoleDto.userId,
        assignRoleDto.role
      );
      
      return { 
        success: true, 
        message: 'Role assigned successfully',
        userId: assignRoleDto.userId,
        role: assignRoleDto.role
      };
    } catch (error) {
      throw new BadRequestException(`Failed to assign role: ${error.message}`);
    }
  }

  // Create or update a role
  @Put('roles/:name')
  @RequirePermissions(Permission.ASSIGN_ROLES, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create or update a role' })
  @ApiResponse({ status: 200, description: 'Role created/updated successfully.' })
  async updateRole(
    @Param('name') name: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User('id') adminId: string
  ) {
    try {
      if (name !== updateRoleDto.name) {
        throw new BadRequestException('Role name in URL must match name in request body');
      }
      
      await this.permissionService.updateRole(
        updateRoleDto.name,
        updateRoleDto.description,
        updateRoleDto.permissions,
        adminId
      );
      
      return { 
        success: true, 
        message: 'Role updated successfully',
        role: updateRoleDto
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update role: ${error.message}`);
    }
  }

  // Delete a role
  @Delete('roles/:name')
  @RequirePermissions(Permission.ASSIGN_ROLES, Permission.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully.' })
  async deleteRole(
    @Param('name') name: string,
    @User('id') adminId: string
  ) {
    try {
      // Prevent deletion of system roles
      const systemRoles = ['user', 'admin', 'super_admin', 'flag_manager', 'tenant_manager'];
      if (systemRoles.includes(name)) {
        throw new BadRequestException('Cannot delete system roles');
      }
      
      await this.permissionService.deleteRole(name, adminId);
      
      return { 
        success: true, 
        message: 'Role deleted successfully',
        role: name
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete role: ${error.message}`);
    }
  }
} 