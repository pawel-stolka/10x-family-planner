import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  WeeklySchedule,
} from '../models/schedule.model';

/**
 * ScheduleService - HTTP communication with schedule API
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1';

  /**
   * Generate weekly schedule using AI
   * POST /v1/schedule-generator
   */
  generateSchedule(
    request: GenerateScheduleRequest
  ): Observable<GenerateScheduleResponse> {
    return this.http.post<GenerateScheduleResponse>(
      `${this.apiUrl}/schedule-generator`,
      request
    );
  }

  /**
   * Get schedule by ID
   * GET /v1/weekly-schedules/:scheduleId
   */
  getSchedule(scheduleId: string): Observable<WeeklySchedule> {
    return this.http.get<WeeklySchedule>(
      `${this.apiUrl}/weekly-schedules/${scheduleId}`
    );
  }

  /**
   * List schedules
   * GET /v1/weekly-schedules
   */
  listSchedules(params?: {
    weekStartDate?: string;
    isAiGenerated?: boolean;
  }): Observable<WeeklySchedule[]> {
    let url = `${this.apiUrl}/weekly-schedules`;
    const queryParams: string[] = [];

    if (params?.weekStartDate) {
      queryParams.push(`weekStartDate=${params.weekStartDate}`);
    }
    if (params?.isAiGenerated !== undefined) {
      queryParams.push(`isAiGenerated=${params.isAiGenerated}`);
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    return this.http.get<WeeklySchedule[]>(url);
  }
}
