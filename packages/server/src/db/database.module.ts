import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config';
import { getRedisConfig } from './redis.config';

@Module({
  imports: [
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
  ],
})
export class DatabaseModule {} 