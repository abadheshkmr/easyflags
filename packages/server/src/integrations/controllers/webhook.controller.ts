import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { createHmac } from 'crypto';
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
  [key: string]: any;
}

@ApiTags('integrations')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookSecret: string;
  private readonly systemUserId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantProvisioningService: TenantProvisioningService
  ) {
    this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET', '');
    this.systemUserId = this.configService.get<string>('SYSTEM_USER_ID', 'system');
  }

  @Post('tenant')
  @ApiOperation({ summary: 'Receive tenant webhooks from SaaS platform' })
  @ApiHeader({ name: 'x-signature', description: 'HMAC signature for payload verification' })
  @ApiBody({ description: 'Webhook payload with tenant information' })
  async handleTenantWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-signature') signature: string
  ) {
    this.logger.log(`Received tenant webhook: ${payload.event}`);
    
    // Verify signature if secret is configured
    if (this.webhookSecret) {
      this.verifySignature(payload, signature);
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

    if (signature !== calculatedSignature) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }
  }
} 