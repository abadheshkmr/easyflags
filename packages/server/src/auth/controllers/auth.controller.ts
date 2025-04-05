import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { CreateUserDto, LoginDto, AuthResponse } from '@feature-flag-service/common';
import { IsString, IsNotEmpty } from 'class-validator';

// Define API key auth DTO with validation
class ApiKeyAuthDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async register(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get auth token using API key' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated with API key.' })
  @ApiResponse({ status: 401, description: 'Invalid API key.' })
  async getTokenWithApiKey(@Body() apiKeyAuthDto: ApiKeyAuthDto, @Req() request: any): Promise<{ token: string }> {
    // Enhanced request logging to help with debugging
    this.logger.log(`⬇️ Token request incoming [${request.method} ${request.url}]`);
    this.logger.log(`📝 Token request payload: ${JSON.stringify(apiKeyAuthDto)}`);
    
    // Debug headers for content-type issues
    this.logger.log(`🔍 Content-Type: ${request.headers['content-type']}`);
    
    // Log raw body data to help diagnose parsing issues
    this.logger.log(`🧩 Raw request body: ${JSON.stringify(request.body)}`);
    
    // Check if body data looks correct
    if (!apiKeyAuthDto.apiKey || !apiKeyAuthDto.tenantId) {
      this.logger.warn(`⚠️ Incomplete request data - apiKey: ${Boolean(apiKeyAuthDto.apiKey)}, tenantId: ${Boolean(apiKeyAuthDto.tenantId)}`);
      
      // Fallback to request body if DTO parsing fails
      const apiKey = apiKeyAuthDto.apiKey || request.body?.apiKey;
      const tenantId = apiKeyAuthDto.tenantId || request.body?.tenantId;
      
      if (apiKey && tenantId) {
        this.logger.log(`🔄 Using fallback data from raw request body`);
        
        try {
          const token = await this.authService.validateApiKey(apiKey, tenantId);
          this.logger.log(`✅ Fallback authentication successful for tenant: ${tenantId}`);
          return { token };
        } catch (error) {
          this.logger.error(`❌ Fallback authentication failed: ${error.message}`);
          throw error;
        }
      }
      
      this.logger.error(`❌ Missing required parameters after fallback`);
    }
    
    try {
      const token = await this.authService.validateApiKey(
        apiKeyAuthDto.apiKey, 
        apiKeyAuthDto.tenantId
      );
      
      this.logger.log(`✅ Authentication successful for tenant: ${apiKeyAuthDto.tenantId}`);
      return { token };
    } catch (error) {
      this.logger.error(`❌ Authentication failed: ${error.message}`);
      throw error;
    }
  }
} 