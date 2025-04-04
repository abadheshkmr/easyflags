import { Controller, Post, Get, Body, Param, Headers, Logger } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiHeader } from '@nestjs/swagger';
import { EvaluationService } from '../services/evaluation.service';
import { 
  EvaluationContext, 
  EvaluationResult, 
  BatchEvaluationRequest, 
  BatchEvaluationResult 
} from '../interfaces/evaluation.interface';

@ApiTags('evaluation')
@Controller('api/v1/evaluation')
export class EvaluationController {
  private readonly logger = new Logger(EvaluationController.name);
  
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post(':key')
  @ApiOperation({ summary: 'Evaluate a single feature flag' })
  @ApiParam({ name: 'key', description: 'Feature flag key' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async evaluateFlag(
    @Param('key') key: string,
    @Body() context: EvaluationContext,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<EvaluationResult> {
    this.logger.log(`🚩 Evaluating flag: "${key}" for tenant: "${tenantId}"`);
    this.logger.log(`📊 Evaluation context: ${JSON.stringify(context)}`);
    
    if (!this.isValidUUID(tenantId)) {
      this.logger.warn(`⚠️ Non-UUID tenant ID format: ${tenantId}`);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid tenant ID format');
      }
    }
    
    try {
      const result = await this.evaluationService.evaluateFlag(key, context, tenantId);
      this.logger.log(`✅ Flag evaluation result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Flag evaluation failed: ${error.message}`);
      throw error;
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch evaluate multiple feature flags' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async evaluateFlags(
    @Body() request: BatchEvaluationRequest,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<BatchEvaluationResult> {
    this.logger.debug(`Batch evaluating ${request.keys.length} flags for tenant ${tenantId}`);
    return this.evaluationService.batchEvaluate(request.keys, request.context, tenantId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for evaluation API' })
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
