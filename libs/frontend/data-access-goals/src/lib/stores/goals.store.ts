import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GoalsApiService } from '../services/goals-api.service';
import {
  RecurringGoal,
  CreateGoalRequest,
  UpdateGoalRequest,
  QueryGoalsParams,
} from '../models/recurring-goal.model';

/**
 * Goals Store
 *
 * Signal-based state management for recurring goals.
 */
@Injectable({ providedIn: 'root' })
export class GoalsStore {
  private readonly goalsApi = inject(GoalsApiService);

  // State
  private readonly goalsSignal = signal<RecurringGoal[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly goals = this.goalsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed
  readonly goalsCount = computed(() => this.goalsSignal().length);
  readonly hasGoals = computed(() => this.goalsSignal().length > 0);

  readonly goalsByPriority = computed(() => {
    const goals = this.goalsSignal();
    return {
      high: goals.filter((g) => g.priority === 2),
      medium: goals.filter((g) => g.priority === 1),
      low: goals.filter((g) => g.priority === 0),
    };
  });

  readonly goalsByMember = computed(() => {
    const goals = this.goalsSignal();
    const grouped = new Map<string, RecurringGoal[]>();
    goals.forEach((goal) => {
      const memberId = goal.familyMemberId;
      if (!grouped.has(memberId)) {
        grouped.set(memberId, []);
      }
      grouped.get(memberId)!.push(goal);
    });
    return grouped;
  });

  // Actions
  async loadGoals(params?: QueryGoalsParams): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const goals = await firstValueFrom(this.goalsApi.getGoals(params));
      this.goalsSignal.set(goals || []);
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to load goals');
      console.error('Failed to load goals:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createGoal(request: CreateGoalRequest): Promise<RecurringGoal | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const newGoal = await firstValueFrom(this.goalsApi.createGoal(request));
      if (newGoal) {
        this.goalsSignal.update((goals) => [...goals, newGoal]);
        return newGoal;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to create goal');
      console.error('Failed to create goal:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async updateGoal(
    goalId: string,
    request: UpdateGoalRequest
  ): Promise<RecurringGoal | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const updatedGoal = await firstValueFrom(
        this.goalsApi.updateGoal(goalId, request)
      );
      if (updatedGoal) {
        this.goalsSignal.update((goals) =>
          goals.map((g) => (g.goalId === goalId ? updatedGoal : g))
        );
        return updatedGoal;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to update goal');
      console.error('Failed to update goal:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await firstValueFrom(this.goalsApi.deleteGoal(goalId));
      this.goalsSignal.update((goals) =>
        goals.filter((g) => g.goalId !== goalId)
      );
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to delete goal');
      console.error('Failed to delete goal:', error);
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
