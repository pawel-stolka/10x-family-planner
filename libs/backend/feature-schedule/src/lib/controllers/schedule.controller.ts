import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScheduleService } from '../services/schedule.service';
import { ScheduleMapper } from '../mappers/schedule.mapper';
import {
  JwtAuthGuard,
  CurrentUser,
  JwtPayload,
} from '@family-planner/backend/feature-auth';
import { GetScheduleParamsDto } from '../dto/get-schedule-params.dto';
import { WeeklyScheduleDto } from '../dto/weekly-schedule.dto';

/**
 * Schedule Controller
 *
 * REST API endpoints for weekly schedule operations.
 * Base path: /v1/weekly-schedules
 *
 * Security:
 * - All routes protected by JWT authentication
 * - Rate limiting: 60 req/min/user (handled by API Gateway)
 *
 * Response format:
 * - Success: JSON with WeeklyScheduleDto
 * - Error: JSON with status, error, message, timestamp, path
 */
@Controller('v1/weekly-schedules')
@ApiTags('Weekly Schedules')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name);

  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly scheduleMapper: ScheduleMapper
  ) {}

  /**
   * GET /v1/weekly-schedules/:scheduleId
   *
   * Retrieve a single weekly schedule by ID with all time blocks.
   * Includes eager-loaded relations: family members, recurring goals.
   *
   * Security:
   * - Requires valid JWT token
   * - Only returns schedules owned by authenticated user
   * - RLS + application-level authorization
   *
   * Performance:
   * - Single database query with eager loading
   * - Typical response time: < 100ms (p50)
   */
  @Get(':scheduleId')
  @ApiOperation({
    summary: 'Get weekly schedule by ID',
    description:
      'Retrieves a complete weekly schedule with all time blocks, family member assignments, and recurring goal links. Requires authentication and ownership.',
  })
  @ApiParam({
    name: 'scheduleId',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the weekly schedule to retrieve',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule found and returned successfully',
    type: WeeklyScheduleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 400 },
        error: { type: 'string', example: 'Bad Request' },
        message: { type: 'string', example: 'scheduleId must be a valid UUID' },
        timestamp: { type: 'string', example: '2026-01-09T12:34:56Z' },
        path: { type: 'string', example: '/v1/weekly-schedules/invalid-uuid' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 401 },
        error: { type: 'string', example: 'Unauthorized' },
        message: {
          type: 'string',
          example: 'Invalid or expired token',
        },
        timestamp: { type: 'string', example: '2026-01-09T12:34:56Z' },
        path: {
          type: 'string',
          example: '/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found or user does not have access',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        error: { type: 'string', example: 'Not Found' },
        message: { type: 'string', example: 'Weekly schedule not found' },
        timestamp: { type: 'string', example: '2026-01-09T12:34:56Z' },
        path: {
          type: 'string',
          example: '/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 500 },
        error: { type: 'string', example: 'Internal Server Error' },
        message: { type: 'string', example: 'An unexpected error occurred' },
        timestamp: { type: 'string', example: '2026-01-09T12:34:56Z' },
        path: {
          type: 'string',
          example: '/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  @ApiBearerAuth()
  async getScheduleById(
    @Param() params: GetScheduleParamsDto,
    @CurrentUser() user: JwtPayload
  ): Promise<WeeklyScheduleDto> {
    this.logger.log(
      `User ${user.userId} fetching schedule ${params.scheduleId}`
    );

    // Fetch schedule from service with RLS and ownership verification
    const schedule = await this.scheduleService.findScheduleById(
      params.scheduleId,
      user.userId
    );

    // Transform entity to DTO
    const dto = this.scheduleMapper.toDto(schedule);

    this.logger.log(
      `Successfully returned schedule ${params.scheduleId} with ${dto.timeBlocks.length} blocks`
    );

    return dto;
  }
}
