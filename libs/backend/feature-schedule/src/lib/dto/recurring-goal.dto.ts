import { ApiProperty } from '@nestjs/swagger';

/**
 * Recurring Goal DTO (Minimal)
 * 
 * Minimal representation of a recurring goal for nested responses.
 * Used when time blocks are linked to recurring goals.
 */
export class RecurringGoalDto {
  @ApiProperty({
    description: 'Unique identifier for the recurring goal',
    format: 'uuid',
    example: 'abc12345-e89b-12d3-a456-426614174111',
  })
  goalId!: string;

  @ApiProperty({
    description: 'Name/title of the goal',
    example: 'Fitness routine',
  })
  name!: string;

  @ApiProperty({
    description: 'How many times per week this goal should be scheduled',
    minimum: 1,
    maximum: 21,
    example: 3,
  })
  frequencyPerWeek!: number;
}
