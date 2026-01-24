import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Get Time Block Params DTO
 *
 * Validates path parameters for time block operations:
 * - PATCH /v1/weekly-schedules/:scheduleId/time-blocks/:blockId
 * - DELETE /v1/weekly-schedules/:scheduleId/time-blocks/:blockId
 * Ensures both scheduleId and blockId are valid UUID v4 before processing.
 */
export class GetTimeBlockParamsDto {
  @ApiProperty({
    description: 'Schedule UUID (version 4)',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'scheduleId must be a valid UUID' })
  scheduleId!: string;

  @ApiProperty({
    description: 'Time block UUID (version 4)',
    format: 'uuid',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4', { message: 'blockId must be a valid UUID' })
  blockId!: string;
}
