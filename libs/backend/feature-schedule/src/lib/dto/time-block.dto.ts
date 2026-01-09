import { ApiProperty } from '@nestjs/swagger';
import { BlockType } from '@family-planner/shared/models-schedule';
import { TimeRangeDto } from './time-range.dto';
import { FamilyMemberDto } from './family-member.dto';
import { RecurringGoalDto } from './recurring-goal.dto';

/**
 * Time Block DTO
 * 
 * Represents a scheduled time block within a weekly schedule.
 * Used in API responses for GET /v1/weekly-schedules/:scheduleId
 */
export class TimeBlockDto {
  @ApiProperty({
    description: 'Unique identifier for the time block',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  blockId: string;

  @ApiProperty({
    description: 'Reference to the parent weekly schedule',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  scheduleId: string;

  @ApiProperty({
    description: 'Optional reference to a recurring goal this block fulfills',
    format: 'uuid',
    required: false,
    nullable: true,
    example: 'abc12345-e89b-12d3-a456-426614174111',
  })
  recurringGoalId?: string;

  @ApiProperty({
    description: 'Optional reference to the family member this block is assigned to',
    format: 'uuid',
    required: false,
    nullable: true,
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  familyMemberId?: string;

  @ApiProperty({
    description: 'Display title for the time block',
    example: 'Morning Workout',
  })
  title: string;

  @ApiProperty({
    description: 'Category of the time block',
    enum: BlockType,
    example: BlockType.ACTIVITY,
  })
  blockType: BlockType;

  @ApiProperty({
    description: 'Time range when this block is scheduled',
    type: TimeRangeDto,
  })
  timeRange: TimeRangeDto;

  @ApiProperty({
    description: 'Whether this block is visible/shared with all family members',
    example: false,
  })
  isShared: boolean;

  @ApiProperty({
    description: 'Additional metadata stored as JSON (e.g., location, notes, tags)',
    example: { location: 'Home gym', intensity: 'high' },
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Populated family member data if familyMemberId exists',
    type: FamilyMemberDto,
    required: false,
    nullable: true,
  })
  familyMember?: FamilyMemberDto;

  @ApiProperty({
    description: 'Populated recurring goal data if recurringGoalId exists',
    type: RecurringGoalDto,
    required: false,
    nullable: true,
  })
  recurringGoal?: RecurringGoalDto;

  @ApiProperty({
    description: 'Timestamp when the block was created',
    example: '2026-01-09T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Timestamp when the block was last updated',
    example: '2026-01-09T12:00:00Z',
  })
  updatedAt: string;
}
