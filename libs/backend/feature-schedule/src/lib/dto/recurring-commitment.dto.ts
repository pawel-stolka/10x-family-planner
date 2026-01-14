import { ApiProperty } from '@nestjs/swagger';
import { BlockType } from '@family-planner/shared-models-schedule';

export class RecurringCommitmentDto {
  @ApiProperty({ format: 'uuid' })
  commitmentId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid', required: false, nullable: true })
  familyMemberId?: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: BlockType })
  blockType!: BlockType;

  @ApiProperty({
    description: 'Day of week: 1=Monday ... 7=Sunday',
    minimum: 1,
    maximum: 7,
    example: 1,
  })
  dayOfWeek!: number;

  @ApiProperty({ description: 'Start time (HH:MM:SS)', example: '08:00:00' })
  startTime!: string;

  @ApiProperty({ description: 'End time (HH:MM:SS)', example: '16:00:00' })
  endTime!: string;

  @ApiProperty({ description: 'Shared with the whole family', example: false })
  isShared!: boolean;

  @ApiProperty({ type: Object })
  metadata!: Record<string, any>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

