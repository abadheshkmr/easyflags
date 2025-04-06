import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserEntity } from './entities/user.entity';
import { UserPreference } from './entities/user-preference.entity';
import { ApiKey } from './entities/api-key.entity';
import { Role } from './entities/role.entity';
import { UserService } from './services/user.service';
import { ApiKeyService } from './services/api-key.service';
import { UserController } from './controllers/user.controller';
import { ApiKeyController, AdminApiKeyController } from './controllers/api-key.controller';
import { PermissionConfigModule } from './config/permission-config.module';
import { PermissionService } from './services/permission.service';
import { AuditLogModule } from '../common/audit/audit-log.module';
import { PermissionManagementController } from './controllers/permission-management.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, Role, UserPreference, ApiKey]),
    PermissionConfigModule,
    AuditLogModule,
  ],
  controllers: [
    AuthController, 
    UserController, 
    ApiKeyController, 
    AdminApiKeyController,
    PermissionManagementController
  ],
  providers: [AuthService, UserService, ApiKeyService, JwtStrategy, PermissionService],
  exports: [AuthService, UserService, ApiKeyService, PermissionService],
})
export class AuthModule {} 