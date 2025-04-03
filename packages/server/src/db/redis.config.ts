import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const getRedisConfig = (configService: ConfigService): CacheModuleOptions => ({
  store: redisStore,
  host: configService.get('REDIS_HOST', 'localhost'),
  port: configService.get('REDIS_PORT', 6379),
  password: configService.get('REDIS_PASSWORD', ''),
  ttl: configService.get('REDIS_TTL', 60),
  db: configService.get('REDIS_DB', 0),
  tls: configService.get('REDIS_TLS_ENABLED', false) ? {} : undefined
}); 