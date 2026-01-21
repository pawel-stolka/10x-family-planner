import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
  HttpCode,
  HttpStatus,
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
import { GetTimeBlockParamsDto } from '../dto/get-time-block-params.dto';
import { WeeklyScheduleDto } from '../dto/weekly-schedule.dto';
import { CreateTimeBlockDto } from '../dto/create-time-block.dto';
import { UpdateTimeBlockDto } from '../dto/update-time-block.dto';
import { TimeBlockDto } from '../dto/time-block.dto';

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

  /**
   * GET /v1/weekly-schedules
   *
   * List all schedules for authenticated user with optional filters.
   * Can filter by week start date to check if schedule already exists.
   *
   * Query params:
   * - weekStartDate (optional): ISO date string (Monday of the week)
   * - isAiGenerated (optional): boolean filter
   */
  @Get()
  @ApiOperation({
    summary: 'List weekly schedules',
    description:
      'Retrieves all weekly schedules for authenticated user. Can filter by week start date to check if schedule exists before generating new one.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedules found and returned successfully',
    type: [WeeklyScheduleDto],
  })
  @ApiBearerAuth()
  async listSchedules(
    @Query('weekStartDate') weekStartDate?: string,
    @Query('isAiGenerated') isAiGenerated?: boolean,
    @CurrentUser() user?: JwtPayload
  ): Promise<WeeklyScheduleDto[]> {
    this.logger.log(`User ${user?.userId} listing schedules`);

    const filters: any = {};

    if (weekStartDate) {
      filters.weekStartDate = new Date(weekStartDate);
    }

    if (isAiGenerated !== undefined) {
      filters.isAiGenerated = isAiGenerated;
    }

    const schedules = await this.scheduleService.listSchedules(
      user!.userId,
      filters
    );

    const dtos = schedules.map((schedule) =>
      this.scheduleMapper.toDto(schedule)
    );

    this.logger.log(
      `Successfully returned ${dtos.length} schedules for user ${user?.userId}`
    );

    return dtos;
  }

  /**
   * POST /v1/weekly-schedules/:scheduleId/time-blocks
   *
   * Create a new time block in a weekly schedule.
   * Validates schedule ownership and time block data.
   *
   * Security:
   * - Requires valid JWT token
   * - Only allows creating blocks in schedules owned by authenticated user
   * - RLS + application-level authorization
   */
  @Post(':scheduleId/time-blocks')
  @ApiOperation({
    summary: 'Create time block',
    description:
      'Creates a new time block in the specified weekly schedule. Validates schedule ownership and time block constraints.',
  })
  @ApiParam({
    name: 'scheduleId',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the weekly schedule',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Time block created successfully',
    type: TimeBlockDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found or user does not have access',
  })
  @ApiBearerAuth()
  async createTimeBlock(
    @Param() params: GetScheduleParamsDto,
    @Body() dto: CreateTimeBlockDto,
    @CurrentUser() user: JwtPayload
  ): Promise<TimeBlockDto> {
    this.logger.log(
      `User ${user.userId} creating time block in schedule ${params.scheduleId}`
    );

    // Create time block via service
    const timeBlock = await this.scheduleService.createTimeBlock(
      params.scheduleId,
      user.userId,
      dto
    );

    // Transform entity to DTO
    const dto_result = this.scheduleMapper.timeBlockToDto(timeBlock);

    this.logger.log(
      `Successfully created time block ${timeBlock.blockId} in schedule ${params.scheduleId}`
    );

    return dto_result;
  }

  /**
   * PATCH /v1/weekly-schedules/:scheduleId/time-blocks/:blockId
   *
   * Update an existing time block in a weekly schedule.
   * Validates schedule ownership and time block data.
   * All fields in the request body are optional - only provided fields will be updated.
   *
   * Security:
   * - Requires valid JWT token
   * - Only allows updating blocks in schedules owned by authenticated user
   * - RLS + application-level authorization
   */
  @Patch(':scheduleId/time-blocks/:blockId')
  @ApiOperation({
    summary: 'Update time block',
    description:
      'Updates an existing time block in the specified weekly schedule. All fields are optional - only provided fields will be updated. Validates schedule ownership and time block constraints.',
  })
  @ApiParam({
    name: 'scheduleId',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the weekly schedule',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'blockId',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the time block to update',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Time block updated successfully',
    type: TimeBlockDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule or time block not found or user does not have access',
  })
  @ApiResponse({
    status: 409,
    description: 'Updated time range conflicts with another activity',
  })
  @ApiBearerAuth()
  async updateTimeBlock(
    @Param() params: GetTimeBlockParamsDto,
    @Body() dto: UpdateTimeBlockDto,
    @CurrentUser() user: JwtPayload
  ): Promise<TimeBlockDto> {
    this.logger.log(
      `User ${user.userId} updating time block ${params.blockId} in schedule ${params.scheduleId}`
    );

    // Update time block via service
    const timeBlock = await this.scheduleService.updateTimeBlock(
      params.scheduleId,
      params.blockId,
      user.userId,
      dto
    );

    // Transform entity to DTO
    const dto_result = this.scheduleMapper.timeBlockToDto(timeBlock);

    this.logger.log(
      `Successfully updated time block ${params.blockId} in schedule ${params.scheduleId}`
    );

    return dto_result;
  }

  /**
   * DELETE /v1/weekly-schedules/:scheduleId/time-blocks/:blockId
   *
   * Delete (soft delete) a time block from a weekly schedule.
   * Validates schedule ownership.
   *
   * Security:
   * - Requires valid JWT token
   * - Only allows deleting blocks in schedules owned by authenticated user
   * - RLS + application-level authorization
   */
  @Delete(':scheduleId/time-blocks/:blockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete time block',
    description:
      'Soft deletes a time block from the specified weekly schedule. Validates schedule ownership.',
  })
  @ApiParam({
    name: 'scheduleId',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the weekly schedule',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'blockId',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the time block to delete',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 204,
    description: 'Time block deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule or time block not found or user does not have access',
  })
  @ApiBearerAuth()
  async deleteTimeBlock(
    @Param() params: GetTimeBlockParamsDto,
    @CurrentUser() user: JwtPayload
  ): Promise<void> {
    this.logger.log(
      `User ${user.userId} deleting time block ${params.blockId} from schedule ${params.scheduleId}`
    );

    // Delete time block via service
    await this.scheduleService.deleteTimeBlock(
      params.scheduleId,
      params.blockId,
      user.userId
    );

    this.logger.log(
      `Successfully deleted time block ${params.blockId} from schedule ${params.scheduleId}`
    );
  }
}
