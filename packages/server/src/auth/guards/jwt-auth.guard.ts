import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
  
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { url, method } = request;
    
    if (err || !user) {
      const errorMsg = err?.message || info?.message || 'Unauthorized access';
      this.logger.warn(
        `Authentication failed: ${errorMsg} | Path: ${method} ${url} | IP: ${request.ip}`
      );
      
      throw new UnauthorizedException(errorMsg);
    }
    
    this.logger.debug(
      `User authenticated: ${user.id} | Path: ${method} ${url}`
    );
    
    return user;
  }
} 