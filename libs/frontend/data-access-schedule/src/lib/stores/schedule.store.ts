import { Injectable, signal, computed, inject } from '@angular/core';
import { tap, catchError, throwError, finalize } from 'rxjs';
import { ScheduleService } from '../services/schedule.service';
import {
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  WeeklySchedule,
} from '../models/schedule.model';

/**
 * ScheduleStore - Manages schedule state using Angular Signals
 *
 * Responsibilities:
 * - Current schedule state
 * - Generation progress tracking
 * - Error handling
 * - Loading states
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleStore {
  private readonly scheduleService = inject(ScheduleService);

  // Signals
  private readonly currentScheduleSignal = signal<WeeklySchedule | null>(null);
  private readonly generatingSignal = signal<boolean>(false);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly lastGeneratedSignal = signal<GenerateScheduleResponse | null>(null);

  // Public readonly signals
  readonly currentSchedule = this.currentScheduleSignal.asReadonly();
  readonly generating = this.generatingSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly lastGenerated = this.lastGeneratedSignal.asReadonly();

  // Computed signals
  readonly hasSchedule = computed(() => this.currentScheduleSignal() !== null);
  readonly isProcessing = computed(
    () => this.generatingSignal() || this.loadingSignal()
  );

  /**
   * Generate new weekly schedule
   */
  generateSchedule(request: GenerateScheduleRequest) {
    this.generatingSignal.set(true);
    this.errorSignal.set(null);

    return this.scheduleService.generateSchedule(request).pipe(
      tap((response) => {
        this.lastGeneratedSignal.set(response);
        this.generatingSignal.set(false);
        console.log('✅ Schedule generated:', response.scheduleId);
      }),
      catchError((error) => {
        this.generatingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        console.error('❌ Generation failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load schedule by ID
   */
  loadSchedule(scheduleId: string) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.scheduleService.getSchedule(scheduleId).pipe(
      tap((schedule) => {
        this.currentScheduleSignal.set(schedule);
        this.loadingSignal.set(false);
        console.log('✅ Schedule loaded:', scheduleId);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        console.error('❌ Load failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear current schedule
   */
  clearSchedule(): void {
    this.currentScheduleSignal.set(null);
    this.errorSignal.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Extract user-friendly error message
   */
  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.status === 400) {
      return 'Invalid request. Please check your input.';
    }
    if (error?.status === 401) {
      return 'Session expired. Please log in again.';
    }
    if (error?.status === 500) {
      return 'Server error. Please try again later.';
    }
    return error?.message || 'An unexpected error occurred.';
  }
}
