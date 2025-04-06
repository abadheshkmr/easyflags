import { Controller, Get, Put, Patch, Body, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { UserService } from '../services/user.service';
import { UpdateProfileDto, UpdatePasswordDto, UpdatePreferencesDto } from '../dtos/user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the current user profile.' })
  async getCurrentUser(@User('id') userId: string) {
    try {
      return await this.userService.findUserById(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve user profile');
    }
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully.' })
  async updateProfile(
    @User('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    try {
      return await this.userService.updateProfile(userId, updateProfileDto);
    } catch (error) {
      throw new BadRequestException(`Failed to update profile: ${error.message}`);
    }
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  async changePassword(
    @User('id') userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    try {
      return await this.userService.updatePassword(userId, updatePasswordDto);
    } catch (error) {
      throw new BadRequestException(`Failed to change password: ${error.message}`);
    }
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'Returns the user preferences.' })
  async getUserPreferences(@User('id') userId: string) {
    try {
      return await this.userService.getUserPreferences(userId);
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve preferences: ${error.message}`);
    }
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences updated successfully.' })
  async updatePreferences(
    @User('id') userId: string,
    @Body() preferencesDto: UpdatePreferencesDto
  ) {
    try {
      return await this.userService.updatePreferences(userId, preferencesDto);
    } catch (error) {
      throw new BadRequestException(`Failed to update preferences: ${error.message}`);
    }
  }
} 