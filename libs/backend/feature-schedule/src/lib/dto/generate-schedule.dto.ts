import {
  IsDateString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateScheduleDto {
  @ApiProperty({
    description: 'Week start date (must be Monday)',
    example: '2026-01-13',
    type: String,
    format: 'date',
  })
  @IsDateString()
  weekStartDate: string;

  @ApiProperty({
    description: 'Schedule generation strategy',
    enum: ['balanced', 'energy-optimized', 'goal-focused'],
    required: false,
    default: 'balanced',
  })
  @IsOptional()
  @IsEnum(['balanced', 'energy-optimized', 'goal-focused'])
  strategy?: string;

  @ApiProperty({
    description: 'Generation preferences',
    required: false,
    example: {
      respectFixedBlocks: true,
      includeAllGoals: true,
      preferMornings: false,
      maximizeFamilyTime: false,
    },
  })
  @IsOptional()
  @IsObject()
  preferences?: {
    respectFixedBlocks?: boolean;
    includeAllGoals?: boolean;
    preferMornings?: boolean;
    maximizeFamilyTime?: boolean;
  };
}
