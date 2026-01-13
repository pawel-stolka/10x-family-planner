import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * DTO for updating an existing family member
 *
 * All fields are optional (partial update).
 * Role cannot be changed after creation (not included here).
 */
export class UpdateFamilyMemberDto {
  @ApiProperty({
    description: 'Updated name of the family member',
    required: false,
    example: 'John Doe Jr.',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Updated age of the family member',
    required: false,
    example: 9,
    minimum: 0,
    maximum: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  age?: number;

  @ApiProperty({
    description: 'Updated preferences for the family member',
    required: false,
    example: {
      interests: ['sports', 'music'],
      energyLevels: 'MEDIUM',
    },
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
