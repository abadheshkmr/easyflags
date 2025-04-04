import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getDatabaseConfig } from './db/database.config';
import { getRedisConfig } from './db/redis.config';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AdminModule } from './admin/admin.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { TenantContextMiddleware } from './core/middleware/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getRedisConfig,
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    AuthModule,
    CoreModule,
    HealthModule,
    EvaluationModule,
    AdminModule,
    IntegrationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        { path: 'api/v1/monitoring/health', method: RequestMethod.ALL },
        { path: 'api/v1/auth/*', method: RequestMethod.ALL }
      )
      .forRoutes(
        { path: 'api/v1/*', method: RequestMethod.ALL }
      );
  }
} 