import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * App Controller
 *
 * Root-level endpoints for application health and info.
 */
@Controller()
@ApiTags('Health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root endpoint - API information
   */
  @Get()
  @ApiOperation({ summary: 'Get API information' })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Family Planner API' },
        version: { type: 'string', example: '1.0.0' },
        status: { type: 'string', example: 'running' },
        timestamp: { type: 'string', example: '2026-01-09T15:30:00.000Z' },
      },
    },
  })
  getInfo() {
    return this.appService.getInfo();
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        uptime: { type: 'number', example: 123.456 },
        timestamp: { type: 'string', example: '2026-01-09T15:30:00.000Z' },
        database: { type: 'string', example: 'connected' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
