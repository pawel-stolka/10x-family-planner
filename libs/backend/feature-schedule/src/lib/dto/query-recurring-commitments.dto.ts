import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class QueryRecurringCommitmentsDto {
  @ApiProperty({
    required: false,
    description: 'Filter by owner family member id',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  familyMemberId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by day of week: 1=Monday ... 7=Sunday',
    minimum: 1,
    maximum: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;
}

