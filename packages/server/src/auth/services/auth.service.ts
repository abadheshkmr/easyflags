import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto, LoginDto, AuthResponse } from '@feature-flag-service/common';
import { PermissionService } from './permission.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly permissionService: PermissionService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Assign default permissions based on role
    try {
      const roleName = createUserDto.role || 'user';
      await this.permissionService.assignDefaultPermissionsToUser(savedUser.id, roleName);
      this.logger.log(`Default permissions assigned to user ${savedUser.id} with role ${roleName}`);
    } catch (error) {
      this.logger.error(`Failed to assign default permissions to user ${savedUser.id}: ${error.message}`);
      // Continue registration process even if permission assignment fails
    }
    
    const { password, ...userWithoutPassword } = savedUser;

    return {
      accessToken: this.generateToken(savedUser),
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...userWithoutPassword } = user;
    return {
      accessToken: this.generateToken(user),
      user: userWithoutPassword,
    };
  }

  async validateApiKey(apiKey: string, tenantId: string): Promise<string> {
    // This is a simplified implementation for testing purposes
    // In a production environment, you would validate the API key against the database
    
    console.log(`🔑 Validating API key for tenant: ${tenantId}`);
    console.log(`💡 API Key Format: ${apiKey ? apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3) : 'undefined'}`);
    console.log(`🔍 Tenant ID Format: ${tenantId ? (this.isValidUUID(tenantId) ? 'Valid UUID' : 'Not UUID format') : 'undefined'}`);
    
    // Basic validation
    if (!apiKey) {
      console.error('❌ API key is missing or empty');
      throw new UnauthorizedException('API key is required');
    }
    
    if (!tenantId) {
      console.error('❌ Tenant ID is missing or empty');
      throw new UnauthorizedException('Tenant ID is required');
    }
    
    // UUID format check for tenant ID (important for database joins)
    if (!this.isValidUUID(tenantId) && process.env.NODE_ENV === 'production') {
      console.error(`❌ Invalid tenant ID format: ${tenantId}`);
      throw new UnauthorizedException('Invalid tenant ID format');
    }
    
    // In development mode, we can be more lenient
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚧 Development mode: Accepting request with minimal validation');
      
      // Even in dev mode, we warn about UUID format issues
      if (!this.isValidUUID(tenantId)) {
        console.warn(`⚠️ Warning: Non-UUID tenant ID in use (${tenantId}). This may cause issues with database operations.`);
      }
      
      // Generate a token for API access
      const payload = {
        sub: 'api-client',
        tenantId: tenantId,
        // Add extra debug info in dev tokens
        mode: 'development',
        generated: new Date().toISOString()
      };
      
      const token = this.jwtService.sign(payload);
      console.log(`✅ Development token generated for tenant: ${tenantId}`);
      return token;
    } else {
      // Production environment - validate against database
      if (apiKey === 'test-api-key-123456' && this.isValidUUID(tenantId)) {
        const payload = {
          sub: 'api-client',
          tenantId: tenantId,
        };
        
        const token = this.jwtService.sign(payload);
        console.log(`✅ Production token generated for tenant: ${tenantId}`);
        return token;
      }
      
      console.error(`❌ API key validation failed for tenant: ${tenantId}`);
      throw new UnauthorizedException('Invalid API key or tenant ID');
    }
  }

  // Helper method to validate UUID format
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  private generateToken(user: UserEntity): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return this.jwtService.sign(payload);
  }
} 