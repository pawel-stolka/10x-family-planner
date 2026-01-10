import { Injectable } from '@nestjs/common';

/**
 * App Service
 * 
 * Provides application-level information and health check functionality.
 */
@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  /**
   * Get API information
   */
  getInfo() {
    return {
      name: 'Family Planner API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
    };
  }

  /**
   * Health check - returns service status
   */
  getHealth() {
    const uptime = (Date.now() - this.startTime) / 1000; // seconds

    return {
      status: 'ok',
      uptime,
      timestamp: new Date().toISOString(),
      database: 'connected', // TODO: Add actual DB health check
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }
}
