import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { TenantProvisioningService } from '../../core/services/tenant-provisioning.service';

interface WebhookPayload {
  event: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    metadata?: Record<string, any>;
  };
  user?: {
    id: string;
    email: string;
  };
  timestamp?: string;
  [key: string]: any;
}

@ApiTags('integrations')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookSecret: string;
  private readonly systemUserId: string;
  private readonly maxTimestampDiff: number = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantProvisioningService: TenantProvisioningService
  ) {
    this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET', '');
    this.systemUserId = this.configService.get<string>('SYSTEM_USER_ID', 'system');
  }

  @Post('tenant')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive tenant webhooks from SaaS platform' })
  @ApiHeader({ name: 'x-signature', description: 'HMAC signature for payload verification' })
  @ApiHeader({ name: 'x-timestamp', description: 'Timestamp when the webhook was sent' })
  @ApiBody({ description: 'Webhook payload with tenant information' })
  async handleTenantWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string
  ) {
    this.logger.log(`Received tenant webhook: ${payload.event}`);
    
    // Verify webhook in production
    if (this.configService.get('NODE_ENV') === 'production') {
      if (!this.webhookSecret) {
        this.logger.error('Webhook secret not configured in production environment');
        throw new BadRequestException('Server not configured to accept webhooks');
      }
      
      this.verifySignature(payload, signature);
      this.verifyTimestamp(timestamp);
    } else if (this.webhookSecret) {
      // In development, only verify if secret is configured
      try {
        this.verifySignature(payload, signature);
        this.verifyTimestamp(timestamp);
      } catch (error) {
        this.logger.warn(`Webhook verification failed, but proceeding in dev mode: ${error.message}`);
      }
    }

    // Handle different event types
    switch (payload.event) {
      case 'tenant.created':
        return this.handleTenantCreated(payload);
      case 'tenant.updated':
        return this.handleTenantUpdated(payload);
      case 'tenant.deleted':
        return this.handleTenantDeleted(payload);
      default:
        this.logger.warn(`Unknown event type: ${payload.event}`);
        return { success: false, message: 'Unknown event type' };
    }
  }

  private async handleTenantCreated(payload: WebhookPayload) {
    if (!payload.organization) {
      throw new BadRequestException('Missing organization data in payload');
    }

    try {
      // Create a new tenant
      const tenant = await this.tenantProvisioningService.provisionTenant(
        {
          name: payload.organization.name,
          description: `Created via webhook from organization ${payload.organization.id}`
        },
        this.systemUserId,
        { metadata: payload.organization.metadata }
      );

      this.logger.log(`Tenant created via webhook: ${tenant.id}`);
      
      return { 
        success: true, 
        message: 'Tenant created successfully',
        tenantId: tenant.id
      };
    } catch (error) {
      this.logger.error(`Failed to create tenant via webhook: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create tenant: ${error.message}`);
    }
  }

  private async handleTenantUpdated(payload: WebhookPayload) {
    // Implementation for tenant update events
    this.logger.log('Tenant update webhook not implemented yet');
    return { success: true, message: 'Tenant update acknowledged' };
  }

  private async handleTenantDeleted(payload: WebhookPayload) {
    // Implementation for tenant deletion events
    this.logger.log('Tenant deletion webhook not implemented yet');
    return { success: true, message: 'Tenant deletion acknowledged' };
  }

  private verifySignature(payload: WebhookPayload, signature: string): void {
    if (!signature) {
      throw new UnauthorizedException('Missing signature header');
    }

    const hmac = createHmac('sha256', this.webhookSecret);
    const calculatedSignature = hmac
      .update(JSON.stringify(payload))
      .digest('hex');

    try {
      // Use timing-safe comparison to prevent timing attacks
      const isValid = timingSafeEqual(
        Buffer.from(signature), 
        Buffer.from(calculatedSignature)
      );
      
      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (error) {
      this.logger.warn(`Signature verification error: ${error.message}`);
      throw new UnauthorizedException('Invalid signature');
    }
  }
  
  private verifyTimestamp(timestamp: string): void {
    if (!timestamp) {
      throw new UnauthorizedException('Missing timestamp header');
    }
    
    const webhookTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    
    if (isNaN(webhookTime)) {
      throw new BadRequestException('Invalid timestamp format');
    }
    
    if (Math.abs(currentTime - webhookTime) > this.maxTimestampDiff) {
      throw new UnauthorizedException('Webhook timestamp is too old or in the future');
    }
  }
} 