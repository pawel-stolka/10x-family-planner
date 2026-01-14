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

/**
 * Partial update for commitments.
 *
 * Note: We allow updating ownership/sharedness, but enforce invariants in service:
 * - if isShared=true => familyMemberId must be null
 * - if isShared=false => familyMemberId must be provided
 */
export class UpdateRecurringCommitmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: BlockType, required: false })
  @IsOptional()
  @IsEnum(BlockType)
  blockType?: BlockType;

  @ApiProperty({
    required: false,
    description: 'Day of week: 1=Monday ... 7=Sunday',
    minimum: 1,
    maximum: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    required: false,
    description: 'If true, applies to whole family (familyMemberId must be null)',
  })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({
    required: false,
    description: 'Owner when isShared=false; must be null when isShared=true',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  familyMemberId?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

