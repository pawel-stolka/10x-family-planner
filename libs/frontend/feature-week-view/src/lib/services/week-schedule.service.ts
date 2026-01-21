import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WeekScheduleResponse } from '../models/week-grid.models';
import { FamilyMember, TimeBlock } from '@family-planner/shared/models-schedule';

/**
 * Service for fetching week schedule data
 * Extends the base ScheduleService with week-specific functionality
 */
@Injectable()
export class WeekScheduleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1';

  /**
   * Get schedule for specific week
   * Checks if schedule already exists in database, returns empty if not found
   * @param weekStartDate ISO date string (Monday)
   */
  getWeekSchedule(weekStartDate: string): Observable<WeekScheduleResponse> {
    return this.http
      .get<{ timeBlocks: any[]; familyMembers?: any[] }[]>(
        `${this.apiUrl}/weekly-schedules`,
        {
          params: { weekStartDate },
        }
      )
      .pipe(
        map((schedules): WeekScheduleResponse => {
          const weekEnd = this.calculateWeekEnd(weekStartDate);

          if (schedules && schedules.length > 0) {
            const schedule = schedules[0];
            return {
              weekStart: weekStartDate,
              weekEnd,
              timeBlocks: this.normalizeTimeBlocks(schedule.timeBlocks || []),
              familyMembers: schedule.familyMembers || [],
            };
          }

          return {
            weekStart: weekStartDate,
            weekEnd,
            timeBlocks: [],
            familyMembers: [],
          };
        })
      );
  }

  /**
   * Calculate week end date (Sunday) from start date (Monday)
   */
  private calculateWeekEnd(weekStart: string): string {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + 6);
    return date.toISOString().split('T')[0];
  }

  /**
   * Normalize time blocks from API (string dates -> Date objects)
   */
  private normalizeTimeBlocks(blocks: any[]): TimeBlock[] {
    return blocks.map((block) => ({
      ...block,
      timeRange: {
        start: this.toDate(block?.timeRange?.start),
        end: this.toDate(block?.timeRange?.end),
      },
      createdAt: this.toDate(block?.createdAt),
      updatedAt: this.toDate(block?.updatedAt),
    }));
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date('');
  }

  /**
   * Get family members
   */
  getFamilyMembers(): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(`${this.apiUrl}/family-members`);
  }

  /**
   * Create a new time block in a schedule
   * @param scheduleId UUID of the weekly schedule
   * @param data Time block creation data
   */
  createTimeBlock(
    scheduleId: string,
    data: {
      title: string;
      blockType: string;
      familyMemberId?: string | null;
      timeRange: {
        start: string; // ISO datetime
        end: string; // ISO datetime
      };
      isShared: boolean;
      metadata?: Record<string, any>;
    }
  ): Observable<TimeBlock> {
    return this.http.post<TimeBlock>(
      `${this.apiUrl}/weekly-schedules/${scheduleId}/time-blocks`,
      data
    );
  }

  /**
   * Update an existing time block in a schedule
   * @param scheduleId UUID of the weekly schedule
   * @param blockId UUID of the time block to update
   * @param data Time block update data (all fields optional)
   */
  updateTimeBlock(
    scheduleId: string,
    blockId: string,
    data: {
      title?: string;
      blockType?: string;
      familyMemberId?: string | null;
      timeRange?: {
        start: string; // ISO datetime
        end: string; // ISO datetime
      };
      isShared?: boolean;
      metadata?: Record<string, any>;
    }
  ): Observable<TimeBlock> {
    return this.http.patch<TimeBlock>(
      `${this.apiUrl}/weekly-schedules/${scheduleId}/time-blocks/${blockId}`,
      data
    );
  }

  /**
   * Delete (soft delete) a time block from a schedule
   * @param scheduleId UUID of the weekly schedule
   * @param blockId UUID of the time block to delete
   */
  deleteTimeBlock(scheduleId: string, blockId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/weekly-schedules/${scheduleId}/time-blocks/${blockId}`
    );
  }
}
