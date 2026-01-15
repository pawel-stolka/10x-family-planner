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
   * @param weekStartDate ISO date string (Monday)
   */
  getWeekSchedule(weekStartDate: string): Observable<WeekScheduleResponse> {
    // For now, use existing endpoint and transform
    // TODO: Update when backend implements dedicated week endpoint
    return this.http
      .get<{ timeBlocks: TimeBlock[]; members: FamilyMember[] }>(
        `${this.apiUrl}/weekly-schedules`,
        {
          params: { weekStartDate },
        }
      )
      .pipe(
        map((response) => {
          const weekEnd = this.calculateWeekEnd(weekStartDate);
          return {
            weekStart: weekStartDate,
            weekEnd,
            timeBlocks: response.timeBlocks || [],
            members: response.members || [],
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
