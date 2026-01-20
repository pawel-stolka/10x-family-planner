import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { WeeklyScheduleEntity } from '../entities/weekly-schedule.entity';
import { TimeBlockEntity } from '../entities/time-block.entity';
import { CreateTimeBlockDto } from '../dto/create-time-block.dto';

/**
 * Schedule Service
 *
 * Business logic layer for weekly schedule operations.
 * Handles database queries, RLS context setup, and ownership verification.
 *
 * Security:
 * - Sets PostgreSQL RLS context (app.user_id) for each query
 * - Verifies ownership at application level (defense in depth)
 * - Filters soft-deleted records
 */
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(WeeklyScheduleEntity)
    private readonly scheduleRepository: Repository<WeeklyScheduleEntity>,
    @InjectRepository(TimeBlockEntity)
    private readonly timeBlockRepository: Repository<TimeBlockEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * Find weekly schedule by ID with all related data
   *
   * @param scheduleId - UUID of the schedule to retrieve
   * @param userId - UUID of the authenticated user (from JWT)
   * @returns WeeklyScheduleEntity with eager-loaded time blocks and relations
   * @throws NotFoundException if schedule not found or user doesn't own it
   * @throws InternalServerErrorException on database errors
   */
  async findScheduleById(
    scheduleId: string,
    userId: string
  ): Promise<WeeklyScheduleEntity> {
    try {
      // Set RLS context for Row-Level Security
      // This ensures PostgreSQL policies filter data by user_id
      const sanitizedUserId = userId.replace(/'/g, "''");
      await this.dataSource.query(
        `SET LOCAL app.user_id = '${sanitizedUserId}'`
      );

      // Query with eager loading to avoid N+1 problem
      // Single query with LEFT JOINs for optimal performance
      const schedule = await this.scheduleRepository.findOne({
        where: {
          scheduleId,
          deletedAt: IsNull(),
        },
        relations: [
          'timeBlocks',
          'timeBlocks.familyMember',
          'timeBlocks.recurringGoal',
        ],
        order: {
          timeBlocks: {
            // Sort blocks by start time for consistent display
            // Note: timeRange is TSTZRANGE, but TypeORM can't sort directly on it
            // We'll handle sorting after query or use a computed column in future
            createdAt: 'ASC',
          },
        },
      });

      // Schedule not found or doesn't belong to user (RLS filtered it out)
      if (!schedule) {
        this.logger.warn(
          `Schedule not found: ${scheduleId} for user: ${userId}`
        );
        throw new NotFoundException('Weekly schedule not found');
      }

      // Additional ownership verification (defense in depth)
      // RLS should already handle this, but we verify at app level too
      if (schedule.userId !== userId) {
        this.logger.warn(
          `User ${userId} attempted to access schedule ${scheduleId} owned by ${schedule.userId}`
        );
        throw new NotFoundException('Weekly schedule not found');
      }

      // Filter out soft-deleted time blocks
      // RLS might not filter these if policy doesn't check deleted_at on time_blocks
      if (schedule.timeBlocks) {
        schedule.timeBlocks = schedule.timeBlocks.filter(
          (block) => !block.deletedAt
        );
      }

      this.logger.log(
        `Successfully retrieved schedule ${scheduleId} for user ${userId} with ${
          schedule.timeBlocks?.length || 0
        } blocks`
      );

      return schedule;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and wrap database errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Database error fetching schedule ${scheduleId}: ${errorMessage}`,
        errorStack
      );
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  /**
   * Find weekly schedule by week start date
   *
   * @param weekStartDate - Date of Monday for the week
   * @param userId - UUID of the authenticated user (from JWT)
   * @returns WeeklyScheduleEntity with eager-loaded time blocks or null if not found
   * @throws InternalServerErrorException on database errors
   */
  async findScheduleByWeek(
    weekStartDate: Date,
    userId: string
  ): Promise<WeeklyScheduleEntity | null> {
    try {
      // Set RLS context for Row-Level Security
      const sanitizedUserId = userId.replace(/'/g, "''");
      await this.dataSource.query(
        `SET LOCAL app.user_id = '${sanitizedUserId}'`
      );

      // Query with eager loading
      const schedule = await this.scheduleRepository.findOne({
        where: {
          userId,
          weekStartDate,
          deletedAt: IsNull(),
        },
        relations: [
          'timeBlocks',
          'timeBlocks.familyMember',
          'timeBlocks.recurringGoal',
        ],
        order: {
          timeBlocks: {
            createdAt: 'ASC',
          },
        },
      });

      if (schedule) {
        // Filter out soft-deleted time blocks
        if (schedule.timeBlocks) {
          schedule.timeBlocks = schedule.timeBlocks.filter(
            (block) => !block.deletedAt
          );
        }

        this.logger.log(
          `Found existing schedule for week ${weekStartDate.toISOString()} with ${
            schedule.timeBlocks?.length || 0
          } blocks`
        );
      } else {
        this.logger.log(
          `No schedule found for week ${weekStartDate.toISOString()}`
        );
      }

      return schedule;
    } catch (error) {
      // Log and wrap database errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Database error fetching schedule for week ${weekStartDate.toISOString()}: ${errorMessage}`,
        errorStack
      );
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  /**
   * List all schedules for a user (optionally filtered)
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Optional filters (weekStartDate, isAiGenerated)
   * @returns Array of WeeklyScheduleEntity
   */
  async listSchedules(
    userId: string,
    filters?: {
      weekStartDate?: Date;
      isAiGenerated?: boolean;
    }
  ): Promise<WeeklyScheduleEntity[]> {
    try {
      // Set RLS context
      const sanitizedUserId = userId.replace(/'/g, "''");
      await this.dataSource.query(
        `SET LOCAL app.user_id = '${sanitizedUserId}'`
      );

      const whereConditions: any = {
        userId,
        deletedAt: IsNull(),
      };

      if (filters?.weekStartDate) {
        whereConditions.weekStartDate = filters.weekStartDate;
      }

      if (filters?.isAiGenerated !== undefined) {
        whereConditions.isAiGenerated = filters.isAiGenerated;
      }

      const schedules = await this.scheduleRepository.find({
        where: whereConditions,
        relations: [
          'timeBlocks',
          'timeBlocks.familyMember',
          'timeBlocks.recurringGoal',
        ],
        order: {
          weekStartDate: 'DESC',
          timeBlocks: {
            createdAt: 'ASC',
          },
        },
      });

      // Filter out soft-deleted time blocks
      schedules.forEach((schedule) => {
        if (schedule.timeBlocks) {
          schedule.timeBlocks = schedule.timeBlocks.filter(
            (block) => !block.deletedAt
          );
        }
      });

      this.logger.log(`Found ${schedules.length} schedules for user ${userId}`);

      return schedules;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Database error listing schedules for user ${userId}: ${errorMessage}`,
        errorStack
      );
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  /**
   * Create a new time block in a schedule
   *
   * @param scheduleId - UUID of the schedule to add the block to
   * @param userId - UUID of the authenticated user (from JWT)
   * @param dto - Time block creation data
   * @returns Created TimeBlockEntity
   * @throws NotFoundException if schedule not found or user doesn't own it
   * @throws BadRequestException if validation fails (e.g., shared block with familyMemberId)
   * @throws InternalServerErrorException on database errors
   */
  async createTimeBlock(
    scheduleId: string,
    userId: string,
    dto: CreateTimeBlockDto
  ): Promise<TimeBlockEntity> {
    try {
      // Set RLS context
      const sanitizedUserId = userId.replace(/'/g, "''");
      await this.dataSource.query(
        `SET LOCAL app.user_id = '${sanitizedUserId}'`
      );

      // Verify schedule exists and user owns it
      const schedule = await this.findScheduleById(scheduleId, userId);

      // Validate shared block rules
      const isShared = dto.isShared || false;
      if (isShared && dto.familyMemberId) {
        throw new BadRequestException(
          'Shared time blocks cannot have familyMemberId'
        );
      }
      if (!isShared && !dto.familyMemberId) {
        throw new BadRequestException(
          'familyMemberId is required when isShared is false'
        );
      }

      // Convert time range strings to Date objects
      const timeRange = {
        start: new Date(dto.timeRange.start),
        end: new Date(dto.timeRange.end),
      };

      // Validate time range
      if (timeRange.start >= timeRange.end) {
        throw new BadRequestException('End time must be after start time');
      }

      // Create time block entity
      const timeBlock = this.timeBlockRepository.create({
        scheduleId: schedule.scheduleId,
        title: dto.title,
        blockType: dto.blockType,
        familyMemberId: isShared ? undefined : dto.familyMemberId || undefined,
        timeRange,
        isShared,
        metadata: dto.metadata || {},
      });

      const savedBlock = await this.timeBlockRepository.save(timeBlock);

      // Reload with relations for complete response
      const blockWithRelations = await this.timeBlockRepository.findOne({
        where: { blockId: savedBlock.blockId },
        relations: ['familyMember', 'recurringGoal'],
      });

      if (!blockWithRelations) {
        throw new InternalServerErrorException(
          'Failed to reload created time block'
        );
      }

      this.logger.log(
        `Successfully created time block ${savedBlock.blockId} in schedule ${scheduleId}`
      );

      return blockWithRelations;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and wrap database errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Database error creating time block in schedule ${scheduleId}: ${errorMessage}`,
        errorStack
      );
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
