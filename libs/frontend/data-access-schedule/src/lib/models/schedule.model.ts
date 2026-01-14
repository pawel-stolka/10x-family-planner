/**
 * Schedule Models for Frontend
 */

export interface TimeBlock {
  blockId: string;
  scheduleId: string;
  recurringGoalId?: string | null;
  title: string;
  blockType: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
  familyMemberId: string | null;
  timeRange: {
    start: string; // ISO datetime
    end: string; // ISO datetime
  };
  isShared: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySchedule {
  scheduleId: string;
  userId: string;
  weekStartDate: string; // ISO date
  isAiGenerated: boolean;
  metadata?: Record<string, any>;
  timeBlocks?: TimeBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateScheduleRequest {
  weekStartDate: string; // ISO date, must be Monday
  strategy?: 'balanced' | 'energy-optimized' | 'goal-focused';
  preferences?: {
    respectFixedBlocks?: boolean;
    includeAllGoals?: boolean;
    preferMornings?: boolean;
    maximizeFamilyTime?: boolean;
  };
}

export interface ScheduleSummary {
  totalBlocks: number;
  goalsScheduled: number;
  totalGoals: number;
  conflicts: number;
  distribution: Record<string, number>;
}

export interface GenerateScheduleResponse {
  scheduleId: string;
  weekStartDate: string;
  summary: ScheduleSummary;
  timeBlocks: TimeBlock[];
}
