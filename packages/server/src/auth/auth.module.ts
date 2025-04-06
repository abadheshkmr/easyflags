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
import { CoreModule } from '../core/core.module';

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
    CoreModule,
  ],
  controllers: [AuthController, UserController, ApiKeyController, AdminApiKeyController],
  providers: [AuthService, UserService, ApiKeyService, JwtStrategy],
  exports: [AuthService, UserService, ApiKeyService],
})
export class AuthModule {} 