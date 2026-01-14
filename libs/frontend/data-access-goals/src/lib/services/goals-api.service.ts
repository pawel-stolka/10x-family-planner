import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RecurringGoal,
  CreateGoalRequest,
  UpdateGoalRequest,
  QueryGoalsParams,
} from '../models/recurring-goal.model';

/**
 * Goals API Service
 *
 * HTTP client for recurring goals CRUD operations.
 */
@Injectable({ providedIn: 'root' })
export class GoalsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/recurring-goals';

  createGoal(request: CreateGoalRequest): Observable<RecurringGoal> {
    return this.http.post<RecurringGoal>(this.apiUrl, request);
  }

  getGoals(params?: QueryGoalsParams): Observable<RecurringGoal[]> {
    let httpParams = new HttpParams();
    if (params?.familyMemberId) {
      httpParams = httpParams.set('familyMemberId', params.familyMemberId);
    }
    if (params?.priority !== undefined) {
      httpParams = httpParams.set('priority', params.priority.toString());
    }
    if (params?.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    return this.http.get<RecurringGoal[]>(this.apiUrl, { params: httpParams });
  }

  getGoal(goalId: string): Observable<RecurringGoal> {
    return this.http.get<RecurringGoal>(`${this.apiUrl}/${goalId}`);
  }

  updateGoal(
    goalId: string,
    request: UpdateGoalRequest
  ): Observable<RecurringGoal> {
    return this.http.patch<RecurringGoal>(`${this.apiUrl}/${goalId}`, request);
  }

  deleteGoal(goalId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${goalId}`);
  }
}
