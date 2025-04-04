import { Module } from '@nestjs/common';
import { WebhookController } from './controllers/webhook.controller';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [
    ConfigModule,
    CoreModule
  ],
  controllers: [WebhookController],
  providers: []
})
export class IntegrationsModule {} 