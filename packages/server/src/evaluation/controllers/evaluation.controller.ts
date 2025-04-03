import { Controller, Post, Get, Body, Param, Headers, Logger } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiHeader } from '@nestjs/swagger';
import { EvaluationService } from '../services/evaluation.service';
import { 
  EvaluationContext, 
  EvaluationResult, 
  BatchEvaluationRequest, 
  BatchEvaluationResult 
} from '../interfaces/evaluation.interface';

@ApiTags('flag-evaluation')
@Controller('api/v1/evaluate')
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
    this.logger.debug(`Evaluating flag ${key} for tenant ${tenantId}`);
    return this.evaluationService.evaluateFlag(key, context, tenantId);
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
}
