import { ApiProperty } from '@nestjs/swagger';
import { TimeBlockDto } from './time-block.dto';

export class ScheduleGenerationSummaryDto {
  @ApiProperty({ description: 'Total number of time blocks created' })
  totalBlocks: number;

  @ApiProperty({ description: 'Number of goals successfully scheduled' })
  goalsScheduled: number;

  @ApiProperty({ description: 'Total number of goals to schedule' })
  totalGoals: number;

  @ApiProperty({ description: 'Number of scheduling conflicts detected' })
  conflicts: number;

  @ApiProperty({
    description: 'Distribution of blocks across days',
    example: {
      monday: 3,
      tuesday: 2,
      wednesday: 3,
      thursday: 2,
      friday: 3,
      saturday: 1,
      sunday: 1,
    },
  })
  distribution: Record<string, number>;
}

export class ScheduleGenerationResponseDto {
  @ApiProperty({
    description: 'UUID of the created schedule',
    format: 'uuid',
  })
  scheduleId: string;

  @ApiProperty({
    description: 'Week start date',
    format: 'date',
  })
  weekStartDate: string;

  @ApiProperty({
    description: 'Summary of generated schedule',
    type: ScheduleGenerationSummaryDto,
  })
  summary: ScheduleGenerationSummaryDto;

  @ApiProperty({
    description: 'Array of generated time blocks',
    type: [TimeBlockDto],
  })
  timeBlocks: TimeBlockDto[];
}
