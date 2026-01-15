import { FamilyMember, TimeBlock } from '@family-planner/shared/models-schedule';

export interface ScheduleGenerationSummary {
  totalBlocks: number;
  goalsScheduled: number;
  totalGoals: number;
  conflicts: number;
  distribution: Record<string, number>;
}

export interface ScheduleGenerationResponse {
  scheduleId: string;
  weekStartDate: string;
  summary: ScheduleGenerationSummary;
  timeBlocks: TimeBlock[];
}

export interface ScheduleGenerationPreferences {
  respectFixedBlocks?: boolean;
  includeAllGoals?: boolean;
  preferMornings?: boolean;
  maximizeFamilyTime?: boolean;
}

export type ScheduleGenerationStrategy =
  | 'balanced'
  | 'energy-optimized'
  | 'goal-focused';

export interface GenerateScheduleRequest {
  weekStartDate: string;
  strategy?: ScheduleGenerationStrategy;
  preferences?: ScheduleGenerationPreferences;
}
