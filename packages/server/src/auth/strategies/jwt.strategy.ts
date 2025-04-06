import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // Provide a fallback value for the JWT secret if it's not in environment variables
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'easyflags_jwt_secret_key_for_auth_tokens';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    // Log the JWT secret presence (but not the actual value for security)
    console.log(`JWT Strategy initialized with ${jwtSecret ? 'provided' : 'fallback'} secret`);
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      directPermissions: payload.directPermissions || [],
      permissions: payload.permissions || [],
      roles: payload.roles || []
    };
  }
} 