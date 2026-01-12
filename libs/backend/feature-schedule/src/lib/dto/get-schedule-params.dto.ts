import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Get Schedule Params DTO
 * 
 * Validates path parameters for GET /v1/weekly-schedules/:scheduleId
 * Ensures scheduleId is a valid UUID v4 before processing.
 */
export class GetScheduleParamsDto {
  @ApiProperty({
    description: 'Schedule UUID (version 4)',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'scheduleId must be a valid UUID' })
  scheduleId!: string;
}
