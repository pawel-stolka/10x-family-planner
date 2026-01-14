import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a recurring goal
 *
 * Validation rules:
 * - familyMemberId: required UUID
 * - name: required, 1-200 characters
 * - description: optional, max 500 characters
 * - frequencyPerWeek: required, 1-14
 * - preferredDurationMinutes: required, 15-480 (8 hours max)
 * - preferredTimeOfDay: optional array
 * - priority: required, 0-2 (LOW=0, MEDIUM=1, HIGH=2)
 * - rules: optional JSONB object
 */
export class CreateRecurringGoalDto {
  @ApiProperty({
    description: 'UUID of the family member this goal belongs to',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsUUID()
  @IsNotEmpty()
  familyMemberId!: string;

  @ApiProperty({
    description: 'Name of the recurring goal',
    example: 'Morning Workout',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Optional description of the goal',
    required: false,
    example: '30-minute cardio and strength training',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'How many times per week this goal should be scheduled',
    example: 3,
    minimum: 1,
    maximum: 14,
  })
  @IsNumber()
  @Min(1)
  @Max(14)
  frequencyPerWeek!: number;

  @ApiProperty({
    description: 'Preferred duration in minutes',
    example: 30,
    minimum: 15,
    maximum: 480,
  })
  @IsNumber()
  @Min(15)
  @Max(480)
  preferredDurationMinutes!: number;

  @ApiProperty({
    description: 'Preferred time(s) of day for this activity',
    required: false,
    example: ['morning', 'afternoon'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimeOfDay?: string[];

  @ApiProperty({
    description: 'Priority level: 0=LOW, 1=MEDIUM, 2=HIGH',
    example: 1,
    minimum: 0,
    maximum: 2,
  })
  @IsNumber()
  @Min(0)
  @Max(2)
  priority!: number;

  @ApiProperty({
    description: 'Additional scheduling rules and constraints',
    required: false,
    example: {
      daysOfWeek: ['monday', 'wednesday', 'friday'],
      timeRanges: ['09:00-12:00'],
      avoidConflicts: true,
    },
  })
  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;
}
