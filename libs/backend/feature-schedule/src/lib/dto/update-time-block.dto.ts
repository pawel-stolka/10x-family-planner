import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockType } from '@family-planner/shared-models-schedule';
import { TimeRangeDto } from './time-range.dto';

/**
 * Update Time Block DTO
 *
 * Validates request body for PATCH /v1/weekly-schedules/:scheduleId/time-blocks/:blockId
 * All fields are optional - only provided fields will be updated.
 */
export class UpdateTimeBlockDto {
  @ApiProperty({
    description: 'Display title for the time block',
    example: 'Morning Workout',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Category of the time block',
    enum: BlockType,
    example: BlockType.ACTIVITY,
    required: false,
  })
  @IsOptional()
  @IsEnum(BlockType)
  blockType?: BlockType;

  @ApiProperty({
    description:
      'Optional reference to the family member this block is assigned to. Required when isShared=false.',
    format: 'uuid',
    required: false,
    nullable: true,
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsOptional()
  @IsUUID()
  familyMemberId?: string | null;

  @ApiProperty({
    description: 'Time range when this block is scheduled',
    type: TimeRangeDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeRangeDto)
  timeRange?: TimeRangeDto;

  @ApiProperty({
    description:
      'Whether this block is visible/shared with all family members. If true, familyMemberId must be null.',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({
    description:
      'Additional metadata stored as JSON (e.g., location, notes, tags)',
    example: { location: 'Home gym', intensity: 'high' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
