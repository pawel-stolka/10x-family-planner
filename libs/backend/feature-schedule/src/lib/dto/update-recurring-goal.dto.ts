import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * DTO for updating a recurring goal
 *
 * All fields are optional (partial update).
 * familyMemberId cannot be changed after creation.
 */
export class UpdateRecurringGoalDto {
  @ApiProperty({
    description: 'Updated name of the goal',
    required: false,
    example: 'Evening Workout',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({
    description: 'Updated description',
    required: false,
    example: '45-minute cardio session',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Updated frequency per week',
    required: false,
    example: 4,
    minimum: 1,
    maximum: 14,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(14)
  frequencyPerWeek?: number;

  @ApiProperty({
    description: 'Updated preferred duration in minutes',
    required: false,
    example: 45,
    minimum: 15,
    maximum: 480,
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  preferredDurationMinutes?: number;

  @ApiProperty({
    description: 'Updated preferred time(s) of day',
    required: false,
    example: ['evening'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimeOfDay?: string[];

  @ApiProperty({
    description: 'Updated priority level',
    required: false,
    example: 2,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  priority?: number;

  @ApiProperty({
    description: 'Updated scheduling rules',
    required: false,
    example: {
      daysOfWeek: ['tuesday', 'thursday'],
    },
  })
  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;
}
