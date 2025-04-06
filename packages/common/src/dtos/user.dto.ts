import { IsString, IsEmail, IsOptional, MinLength, Matches, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: 'User first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. Include uppercase, lowercase, and numbers',
  })
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password' })
  @IsString()
  confirmPassword: string;
}

export class UpdatePreferencesDto {
  @ApiProperty({ description: 'Dark mode preference', required: false })
  @IsBoolean()
  @IsOptional()
  darkMode?: boolean;

  @ApiProperty({ description: 'Notification preferences', required: false })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiProperty({ description: 'Other UI preferences', required: false })
  @IsObject()
  @IsOptional()
  uiSettings?: Record<string, any>;
} 