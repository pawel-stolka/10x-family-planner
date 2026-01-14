/**
 * Recurring Goal Models and Request DTOs
 *
 * TypeScript interfaces matching the backend API contracts.
 */

export interface RecurringGoal {
  goalId: string;
  familyMemberId: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  preferredDurationMinutes: number;
  preferredTimeOfDay?: string[];
  priority: number; // 0=LOW, 1=MEDIUM, 2=HIGH
  rules?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalRequest {
  familyMemberId: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  preferredDurationMinutes: number;
  preferredTimeOfDay?: string[];
  priority: number;
  rules?: Record<string, any>;
}

export interface UpdateGoalRequest {
  name?: string;
  description?: string;
  frequencyPerWeek?: number;
  preferredDurationMinutes?: number;
  preferredTimeOfDay?: string[];
  priority?: number;
  rules?: Record<string, any>;
}

export interface QueryGoalsParams {
  familyMemberId?: string;
  priority?: number;
  sortBy?: 'name' | 'priority' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}
