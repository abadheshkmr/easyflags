import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('monitoring')
@Controller('monitoring/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'System health check' })
  check() {
    return this.healthService.check();
  }
} 