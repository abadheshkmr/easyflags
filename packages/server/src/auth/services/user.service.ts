import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserPreference } from '../entities/user-preference.entity';
import { compareSync, hashSync } from 'bcrypt';
import { AuditLogService } from '../../common/audit/audit-log.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserPreference)
    private userPreferenceRepository: Repository<UserPreference>,
    private readonly auditLogService: AuditLogService
  ) {}

  /**
   * Find user by ID with preferences
   */
  async findUserById(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'preferences']
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Remove sensitive fields
    delete user.password;
    
    return user;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'preferences']
    });

    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDto: any): Promise<UserEntity> {
    const user = await this.findUserById(userId);

    // Check if email is being changed and if it's unique
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email }
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Update user fields
    Object.assign(user, updateProfileDto);
    
    const updatedUser = await this.userRepository.save(user);
    
    // Log the profile update
    this.auditLogService.logTenantAccess(
      user.tenantId || 'none',
      userId,
      'UPDATE_PROFILE',
      true
    );
    
    // Remove sensitive fields
    delete updatedUser.password;
    
    return updatedUser;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, updatePasswordDto: any): Promise<{ success: boolean, message: string }> {
    const { currentPassword, newPassword, confirmPassword } = updatePasswordDto;
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }
    
    // Get user with password
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
    
    // Verify current password
    if (!compareSync(currentPassword, user.password)) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    // Update password
    user.password = hashSync(newPassword, 10);
    await this.userRepository.save(user);
    
    // Log the password change
    this.auditLogService.logTenantAccess(
      user.tenantId || 'none',
      userId,
      'CHANGE_PASSWORD',
      true
    );
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreference> {
    const user = await this.findUserById(userId);
    
    // If preferences exist, return them
    if (user.preferences) {
      return user.preferences;
    }
    
    // Otherwise create default preferences
    const newPreferences = this.userPreferenceRepository.create({
      userId,
      darkMode: false,
      emailNotifications: true,
      uiSettings: {}
    });
    
    const savedPreferences = await this.userPreferenceRepository.save(newPreferences);
    
    // Update user with preferences relation
    user.preferences = savedPreferences;
    await this.userRepository.save(user);
    
    return savedPreferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferencesDto: any): Promise<UserPreference> {
    // Get existing preferences or create them
    let preferences = await this.getUserPreferences(userId);
    
    // Update preferences
    Object.assign(preferences, preferencesDto);
    
    // Save preferences
    const updatedPreferences = await this.userPreferenceRepository.save(preferences);
    
    // Log the preferences update
    this.auditLogService.logTenantAccess(
      'none',
      userId,
      'UPDATE_PREFERENCES',
      true
    );
    
    return updatedPreferences;
  }
} 