import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { FamilyMemberRole } from '@family-planner/shared-models-schedule';

/**
 * DTO for creating a new family member
 *
 * Validation rules:
 * - name: required, 1-100 characters
 * - role: required, must be valid enum value
 * - age: required if role is CHILD, must be 0-120
 * - preferences: optional JSONB object
 */
export class CreateFamilyMemberDto {
  @ApiProperty({
    description: 'Name of the family member',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Role of the family member within the family',
    enum: FamilyMemberRole,
    example: FamilyMemberRole.USER,
  })
  @IsEnum(FamilyMemberRole)
  @IsNotEmpty()
  role!: FamilyMemberRole;

  @ApiProperty({
    description: 'Age of the family member (required for children)',
    required: false,
    example: 8,
    minimum: 0,
    maximum: 120,
  })
  @ValidateIf((o) => o.role === FamilyMemberRole.CHILD || o.age !== undefined)
  @IsNumber()
  @Min(0)
  @Max(120)
  age?: number;

  @ApiProperty({
    description: 'Additional preferences and metadata for the family member',
    required: false,
    example: {
      interests: ['sports', 'reading'],
      energyLevels: 'HIGH',
    },
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
