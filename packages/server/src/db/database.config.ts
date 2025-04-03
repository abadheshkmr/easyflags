import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_NAME', 'feature_flags'),
  entities: [join(__dirname, '..', 'core', 'entities', '*.entity.{ts,js}')],
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: configService.get('DB_LOGGING', false),
  ssl: configService.get('DB_SSL', false) ? { rejectUnauthorized: false } : false,
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: true,
  migrationsTableName: 'migrations',
}); 