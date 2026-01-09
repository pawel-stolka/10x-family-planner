import { ApiProperty } from '@nestjs/swagger';

/**
 * Time Range DTO
 * 
 * Represents a time period with start and end timestamps in ISO 8601 format.
 * Used in API responses for time_range fields.
 */
export class TimeRangeDto {
  @ApiProperty({
    description: 'Start time of the range (ISO 8601 timestamp with timezone)',
    example: '2026-01-13T06:00:00Z',
  })
  start: string;

  @ApiProperty({
    description: 'End time of the range (ISO 8601 timestamp with timezone)',
    example: '2026-01-13T07:00:00Z',
  })
  end: string;
}
