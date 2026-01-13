import { Injectable } from '@nestjs/common';
import { WeeklyScheduleEntity } from '../entities/weekly-schedule.entity';
import { TimeBlockEntity } from '../entities/time-block.entity';
import { FamilyMemberEntity } from '../entities/family-member.entity';
import { RecurringGoalEntity } from '../entities/recurring-goal.entity';
import { WeeklyScheduleDto } from '../dto/weekly-schedule.dto';
import { TimeBlockDto } from '../dto/time-block.dto';
import { FamilyMemberDto } from '../dto/family-member.dto';
import { RecurringGoalDto } from '../dto/recurring-goal.dto';

/**
 * Schedule Mapper
 * 
 * Transforms TypeORM entities to API DTOs.
 * Handles:
 * - Date → ISO 8601 string conversion
 * - Nested entity mapping (family members, recurring goals)
 * - TimeRange transformation (already handled by custom transformer)
 * - Metadata and JSONB field passthrough
 */
@Injectable()
export class ScheduleMapper {
  /**
   * Map WeeklyScheduleEntity to WeeklyScheduleDto
   * Main transformation for GET /v1/weekly-schedules/:scheduleId response
   */
  toDto(entity: WeeklyScheduleEntity): WeeklyScheduleDto {
    return {
      scheduleId: entity.scheduleId,
      userId: entity.userId,
      weekStartDate: this.formatDate(entity.weekStartDate),
      isAiGenerated: entity.isAiGenerated,
      metadata: entity.metadata,
      timeBlocks: entity.timeBlocks
        ? entity.timeBlocks.map((block) => this.timeBlockToDto(block))
        : [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Map TimeBlockEntity to TimeBlockDto
   * Handles nested family member and recurring goal mapping
   */
  private timeBlockToDto(entity: TimeBlockEntity): TimeBlockDto {
    return {
      blockId: entity.blockId,
      scheduleId: entity.scheduleId,
      recurringGoalId: entity.recurringGoalId,
      familyMemberId: entity.familyMemberId,
      title: entity.title,
      blockType: entity.blockType,
      timeRange: {
        // TimeRange is already transformed by TimeRangeTransformer
        // Just convert Date objects to ISO strings
        start: entity.timeRange.start.toISOString(),
        end: entity.timeRange.end.toISOString(),
      },
      isShared: entity.isShared,
      metadata: entity.metadata,
      familyMember: entity.familyMember
        ? this.familyMemberToDto(entity.familyMember)
        : undefined,
      recurringGoal: entity.recurringGoal
        ? this.recurringGoalToDto(entity.recurringGoal)
        : undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Map FamilyMemberEntity to FamilyMemberDto (minimal version)
   */
  private familyMemberToDto(entity: FamilyMemberEntity): FamilyMemberDto {
    return {
      familyMemberId: entity.familyMemberId,
      name: entity.name,
      role: entity.role,
      age: entity.age,
    };
  }

  /**
   * Map RecurringGoalEntity to RecurringGoalDto (minimal version)
   */
  private recurringGoalToDto(entity: RecurringGoalEntity): RecurringGoalDto {
    return {
      goalId: entity.goalId,
      name: entity.name,
      frequencyPerWeek: entity.frequencyPerWeek,
    };
  }

  /**
   * Format Date to YYYY-MM-DD string
   * Used for weekStartDate field
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
