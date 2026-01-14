import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsEnum, IsOptional } from 'class-validator';

enum SortByField {
  NAME = 'name',
  PRIORITY = 'priority',
  CREATED_AT = 'createdAt',
}

enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * DTO for querying/filtering recurring goals
 *
 * All fields are optional query parameters.
 */
export class QueryRecurringGoalsDto {
  @ApiProperty({
    description: 'Filter by family member UUID',
    required: false,
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsOptional()
  @IsUUID()
  familyMemberId?: string;

  @ApiProperty({
    description: 'Filter by priority (0=LOW, 1=MEDIUM, 2=HIGH)',
    required: false,
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({
    description: 'Sort by field',
    required: false,
    enum: SortByField,
    example: SortByField.PRIORITY,
  })
  @IsOptional()
  @IsEnum(SortByField)
  sortBy?: SortByField;

  @ApiProperty({
    description: 'Sort order',
    required: false,
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
