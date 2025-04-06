import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-store';

import { EvaluationController } from './controllers/evaluation.controller';
import { MetricsController } from './controllers/metrics.controller';
import { EvaluationService } from './services/evaluation.service';
import { EvaluationMetricsService } from './metrics/evaluation-metrics.service';
import { EvaluationMetrics } from './metrics/evaluation-metrics.entity';
import { FlagGateway } from './websocket/flag.gateway';
import { FeatureFlag, TargetingRule, Condition } from '../core/entities';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { AuthModule } from '../auth/auth.module';
import { PermissionConfigModule } from '../auth/config/permission-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureFlag,
      TargetingRule,
      Condition,
      EvaluationMetrics
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: 60, // Default TTL in seconds
        max: 1000, // Maximum number of items in cache
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({
      // Global event emitter
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    PermissionConfigModule,
  ],
  controllers: [EvaluationController, MetricsController],
  providers: [EvaluationService, EvaluationMetricsService, FlagGateway],
  exports: [EvaluationService, EvaluationMetricsService],
})
export class EvaluationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'api/v1/evaluate*', method: RequestMethod.ALL }
      );
  }
}
