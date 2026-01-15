import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WeekScheduleResponse } from '../models/week-grid.models';
import { TimeBlock, FamilyMember } from '@family-planner/shared/models-schedule';

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
      .get<any[]>(
        `${this.apiUrl}/weekly-schedules`,
        {
          params: { weekStartDate },
        }
      )
      .pipe(
        map((schedules) => {
          const weekEnd = this.calculateWeekEnd(weekStartDate);
          
          // If schedule exists for this week, use it
          if (schedules && schedules.length > 0) {
            const schedule = schedules[0];
            return {
              weekStart: weekStartDate,
              weekEnd,
              timeBlocks: schedule.timeBlocks || [],
              members: [], // Will be loaded separately
            };
          }
          
          // No schedule found, return empty
          return {
            weekStart: weekStartDate,
            weekEnd,
            timeBlocks: [],
            members: [],
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
   * Get family members
   */
  getFamilyMembers(): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(`${this.apiUrl}/family-members`);
  }
}
