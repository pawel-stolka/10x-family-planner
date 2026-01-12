import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScheduleGeneratorService } from '../services/schedule-generator.service';
import {
  JwtAuthGuard,
  CurrentUser,
  JwtPayload,
} from '@family-planner/backend/feature-auth';
import { GenerateScheduleDto } from '../dto/generate-schedule.dto';
import { ScheduleGenerationResponseDto } from '../dto/schedule-generation-response.dto';

/**
 * Schedule Generator Controller
 *
 * Handles AI-powered weekly schedule generation.
 * Base path: /v1/schedule-generator
 *
 * Ultra-MVP Features:
 * - POST /schedule-generator: Generate schedule using GPT-4
 * - Auto-creates mock family/goals if none exist
 * - Returns generated schedule with time blocks
 */
@Controller('v1/schedule-generator')
@ApiTags('Schedule Generation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleGeneratorController {
  private readonly logger = new Logger(ScheduleGeneratorController.name);

  constructor(
    private readonly scheduleGeneratorService: ScheduleGeneratorService
  ) {}

  /**
   * POST /v1/schedule-generator
   *
   * Generate weekly schedule using AI.
   *
   * For Ultra-MVP:
   * - Creates mock family members if none exist
   * - Creates mock recurring goals if none exist
   * - Uses GPT-4 to generate optimized schedule
   * - Saves schedule + time blocks to database
   *
   * @param dto - Generation parameters
   * @param user - Current authenticated user
   * @returns Generated schedule with summary and time blocks
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate weekly schedule with AI',
    description:
      'Uses GPT-4 to generate an optimized weekly schedule based on family members and recurring goals. ' +
      'If no family/goals exist, creates mock data for demo purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule generated successfully',
    type: ScheduleGenerationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (e.g., weekStartDate not a Monday)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error or OpenAI API error',
  })
  async generateSchedule(
    @Body() dto: GenerateScheduleDto,
    @CurrentUser() user: JwtPayload
  ): Promise<ScheduleGenerationResponseDto> {
    // Development fallback: use demo user UUID if authentication is not configured
    // Using a valid UUID format: 00000000-0000-0000-0000-000000000000
    const DEMO_USER_UUID = '00000000-0000-0000-0000-000000000000';
    const userId = user?.userId || DEMO_USER_UUID;

    if (!user?.userId) {
      this.logger.warn(
        `⚠️  No authenticated user found, using demo UUID (${DEMO_USER_UUID}) for development. ` +
          'This means JWT token was not provided or invalid. ' +
          'Check that the frontend is sending the Authorization header!'
      );
    }

    this.logger.log(
      `🪄 User ${userId} requested schedule generation for week ${dto.weekStartDate}`
    );

    const result = await this.scheduleGeneratorService.generateSchedule(
      userId,
      dto
    );

    this.logger.log(
      `✅ Successfully generated schedule ${result.scheduleId} with ${result.summary.totalBlocks} blocks`
    );

    return result;
  }
}
