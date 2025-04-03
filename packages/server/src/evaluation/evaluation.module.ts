import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as redisStore from 'cache-manager-redis-store';
import { EvaluationController } from './controllers/evaluation.controller';
import { EvaluationService } from './services/evaluation.service';
import { FlagGateway } from './websocket/flag.gateway';
import { FeatureFlag, TargetingRule, Condition } from '../core/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureFlag,
      TargetingRule,
      Condition
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
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService, FlagGateway],
  exports: [EvaluationService],
})
export class EvaluationModule {}
