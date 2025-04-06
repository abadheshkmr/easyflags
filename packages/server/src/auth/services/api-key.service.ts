import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes, createHash } from 'crypto';
import { ApiKey } from '../entities/api-key.entity';
import { AuditLogService } from '../../common/audit/audit-log.service';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    private readonly auditLogService: AuditLogService
  ) {}

  /**
   * Find API key by ID
   */
  async findById(id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID '${id}' not found`);
    }

    return apiKey;
  }

  /**
   * Find all API keys for a user
   */
  async findAllByUserId(userId: string): Promise<ApiKey[]> {
    const apiKeys = await this.apiKeyRepository.find({
      where: { userId, active: true },
      order: { createdAt: 'DESC' }
    });

    // Don't return the actual key value for security reasons
    return apiKeys.map(key => {
      const maskedKey = this.maskApiKey(key.key);
      return { ...key, key: maskedKey };
    });
  }

  /**
   * Create a new API key
   */
  async create(
    userId: string, 
    tenantId: string | null, 
    createApiKeyDto: { name: string, expiresAt?: Date }
  ): Promise<{ apiKey: ApiKey, rawKey: string }> {
    // Generate a random API key
    const rawKey = this.generateApiKey();
    const hashedKey = this.hashApiKey(rawKey);
    
    // Create the API key
    const apiKey = this.apiKeyRepository.create({
      userId,
      tenantId,
      name: createApiKeyDto.name,
      key: hashedKey,
      expiresAt: createApiKeyDto.expiresAt,
      active: true,
      scopes: []
    });
    
    const savedApiKey = await this.apiKeyRepository.save(apiKey);
    
    // Log the API key creation (don't log the actual key)
    this.auditLogService.logTenantAccess(
      tenantId || 'none',
      userId,
      'CREATE_API_KEY',
      true
    );
    
    // Return the API key with the raw key (this is the only time it will be available)
    return {
      apiKey: savedApiKey,
      rawKey
    };
  }

  /**
   * Revoke an API key
   */
  async revoke(id: string): Promise<{ success: boolean, message: string }> {
    const apiKey = await this.findById(id);
    
    // Deactivate the API key
    apiKey.active = false;
    await this.apiKeyRepository.save(apiKey);
    
    // Log the API key revocation
    this.auditLogService.logTenantAccess(
      apiKey.tenantId || 'none',
      apiKey.userId,
      'REVOKE_API_KEY',
      true
    );
    
    return {
      success: true,
      message: 'API key revoked successfully'
    };
  }

  /**
   * Update API key last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    await this.apiKeyRepository.update(id, {
      lastUsedAt: new Date()
    });
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    const hashedKey = this.hashApiKey(key);
    
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key: hashedKey, active: true },
      relations: ['user']
    });
    
    if (!apiKey) {
      return null;
    }
    
    // Check if the API key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      // Automatically revoke expired keys
      await this.revoke(apiKey.id);
      return null;
    }
    
    // Update last used timestamp
    await this.updateLastUsed(apiKey.id);
    
    return apiKey;
  }

  /**
   * Generate a new API key
   */
  private generateApiKey(): string {
    // Format: prefix_randomBytes
    const prefix = 'ffs'; // feature flag service
    const randomString = randomBytes(24).toString('hex');
    return `${prefix}_${randomString}`;
  }

  /**
   * Hash an API key for secure storage
   */
  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Mask an API key for display purposes
   */
  private maskApiKey(key: string): string {
    // Return only the first 8 and last 4 characters
    if (key.length <= 12) return '********';
    
    const parts = key.split('_');
    if (parts.length <= 1) return '********';
    
    return `${parts[0]}_****${parts[1].slice(-4)}`;
  }
} 