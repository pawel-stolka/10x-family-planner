import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { BlockType } from '@family-planner/shared-models-schedule';

export class CreateRecurringCommitmentDto {
  @ApiProperty({
    description:
      'Family member owner of this commitment. Required when isShared=false.',
    required: false,
    nullable: true,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  familyMemberId?: string;

  @ApiProperty({ description: 'Title', example: 'Work' })
  @IsString()
  title!: string;

  @ApiProperty({ enum: BlockType, example: BlockType.WORK, required: false })
  @IsOptional()
  @IsEnum(BlockType)
  blockType?: BlockType;

  @ApiProperty({
    description: 'Day of week: 1=Monday ... 7=Sunday',
    minimum: 1,
    maximum: 7,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Start time (HH:MM:SS)', example: '08:00:00' })
  @IsString()
  startTime!: string;

  @ApiProperty({ description: 'End time (HH:MM:SS)', example: '16:00:00' })
  @IsString()
  endTime!: string;

  @ApiProperty({
    description: 'If true, applies to whole family (familyMemberId must be null)',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

