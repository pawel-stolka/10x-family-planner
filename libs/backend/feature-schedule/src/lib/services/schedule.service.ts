import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { WeeklyScheduleEntity } from '../entities/weekly-schedule.entity';

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
      await this.dataSource.query(`SET LOCAL app.user_id = $1`, [userId]);

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
}
